/**
 * Unit & Concurrency Load Test:
 * Cache Expiry Strategy, Distributed Lease/Locking & Stampede Protection.
 */

const redisClient = require("../../src/config/redisClient");
const { cacheService, CACHE_POLICIES } = require("../../src/services/cache/cacheService");
const cacheMetrics = require("../../src/services/cache/cacheMetrics");

describe("Cache Expiry & Stampede Locking Protection Suite", () => {
  beforeEach(async () => {
    cacheMetrics.reset();
    if (typeof redisClient.flushdb === "function") {
      await redisClient.flushdb();
    }
  });

  afterAll(async () => {
    if (typeof redisClient.flushdb === "function") {
      await redisClient.flushdb();
    }
  });

  describe("1. Distributed Lease/Locking (Cache Stampede Protection)", () => {
    it("should allow only ONE fetcher invocation when 30 concurrent requests hit a cold key", async () => {
      let dbQueryCount = 0;
      const testKey = "cache:test:stampede:products:page1";
      const testPolicy = {
        namespace: "test:products",
        freshTtlMs: 2000,
        staleTtlMs: 5000,
        lockDurationMs: 2000,
        enableSwr: true,
        enableLocking: true,
        allowStaleFallback: true,
      };

      // Mock database fetcher that simulates 60ms MongoDB latency
      const mockDatabaseQuery = jest.fn(async () => {
        dbQueryCount++;
        await new Promise((r) => setTimeout(r, 60));
        return {
          status: "success",
          items: [{ id: "prod-1", name: "Paracetamol 500mg", price: 100 }],
          generatedAt: Date.now(),
        };
      });

      // Fire 30 concurrent requests simultaneously at the exact same instant
      const concurrentRequests = Array.from({ length: 30 }, () =>
        cacheService.fetchWithCache({
          key: testKey,
          policy: testPolicy,
          fetcher: mockDatabaseQuery,
        })
      );

      const results = await Promise.all(concurrentRequests);

      // CRITICAL ASSERTION: The database was queried EXACTLY ONCE
      expect(mockDatabaseQuery).toHaveBeenCalledTimes(1);
      expect(dbQueryCount).toBe(1);

      // Every single caller received the valid, identical response
      expect(results.length).toBe(30);
      results.forEach((res) => {
        expect(res.status).toBe("success");
        expect(res.items[0].name).toBe("Paracetamol 500mg");
      });

      // Verify Metrics: 1 Winner acquired lease, 29 Contenders waited and resolved
      const metrics = cacheMetrics.getMetrics();
      const nsMetrics = metrics.byNamespace["test:products"];
      expect(nsMetrics).toBeDefined();
      expect(nsMetrics.misses).toBe(30);
      expect(nsMetrics.leaseAcquired).toBe(1);
      expect(nsMetrics.leaseContended).toBe(29);
      expect(nsMetrics.leaseWaitSuccess).toBe(29);
    });

    it("subsequent requests hitting a fresh cache should never invoke the database", async () => {
      const testKey = "cache:test:fresh:categories";
      const testPolicy = CACHE_POLICIES.CATEGORIES;
      const mockFetcher = jest.fn(async () => ({ categories: ["Antibiotics", "Pain Relief"] }));

      // First call (miss)
      const res1 = await cacheService.fetchWithCache({
        key: testKey,
        policy: testPolicy,
        fetcher: mockFetcher,
      });
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(res1.categories).toHaveLength(2);

      // Next 10 sequential calls (fresh hits)
      for (let i = 0; i < 10; i++) {
        const cachedRes = await cacheService.fetchWithCache({
          key: testKey,
          policy: testPolicy,
          fetcher: mockFetcher,
        });
        expect(cachedRes.categories).toHaveLength(2);
      }

      // Fetcher should STILL have been called only once
      expect(mockFetcher).toHaveBeenCalledTimes(1);

      const metrics = cacheMetrics.getMetrics();
      const nsMetrics = metrics.byNamespace[testPolicy.namespace];
      expect(nsMetrics.hitsFresh).toBe(10);
    });
  });

  describe("2. Stale-While-Revalidate (SWR) Pattern", () => {
    it("should immediately serve stale data past fresh TTL and trigger background revalidation", async () => {
      const testKey = "cache:test:swr:trending";
      let version = 1;

      const fastStalePolicy = {
        namespace: "test:trending",
        freshTtlMs: 50,       // 50ms fresh window
        staleTtlMs: 800,      // 800ms stale window
        lockDurationMs: 1000,
        enableSwr: true,
        enableLocking: true,
        allowStaleFallback: true,
      };

      const fetcher = jest.fn(async () => {
        const curVer = version++;
        return { data: `version_${curVer}` };
      });

      // 1. Initial populate (v1)
      const initial = await cacheService.fetchWithCache({
        key: testKey,
        policy: fastStalePolicy,
        fetcher,
      });
      expect(initial.data).toBe("version_1");
      expect(fetcher).toHaveBeenCalledTimes(1);

      // 2. Wait 70ms: now past 50ms fresh TTL, but well inside 800ms stale TTL
      await new Promise((r) => setTimeout(r, 70));

      // 3. Next request should IMMEDIATELY return stale data ("version_1")
      const staleRes = await cacheService.fetchWithCache({
        key: testKey,
        policy: fastStalePolicy,
        fetcher,
      });
      expect(staleRes.data).toBe("version_1");

      // Verify SWR hit was recorded
      const metricsBeforeReval = cacheMetrics.getMetrics();
      expect(metricsBeforeReval.byNamespace["test:trending"].hitsStaleSwr).toBe(1);

      // 4. Wait 50ms for background revalidation to complete
      await new Promise((r) => setTimeout(r, 50));

      // 5. Subsequent request should now see fresh data ("version_2")
      const freshRes = await cacheService.fetchWithCache({
        key: testKey,
        policy: fastStalePolicy,
        fetcher,
      });
      expect(freshRes.data).toBe("version_2");
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });

  describe("3. Strict Security & Compliance Boundaries", () => {
    it("should NEVER cache when policy freshTtlMs is 0 (Checkout Pricing)", async () => {
      const mockCheckoutCalc = jest.fn(async () => ({ totalPayable: 750 }));
      const key = "cache:checkout:user123";

      const res1 = await cacheService.fetchWithCache({
        key,
        policy: CACHE_POLICIES.CHECKOUT_PRICING,
        fetcher: mockCheckoutCalc,
      });
      const res2 = await cacheService.fetchWithCache({
        key,
        policy: CACHE_POLICIES.CHECKOUT_PRICING,
        fetcher: mockCheckoutCalc,
      });

      expect(res1.totalPayable).toBe(750);
      expect(res2.totalPayable).toBe(750);
      // Both called live — zero caching
      expect(mockCheckoutCalc).toHaveBeenCalledTimes(2);
    });

    it("should bypass cache completely when bypassCache=true is set", async () => {
      const mockFetcher = jest.fn(async () => ({ time: Date.now() }));
      const key = "cache:test:bypass";

      await cacheService.fetchWithCache({
        key,
        policy: CACHE_POLICIES.PRODUCTS_LISTING,
        fetcher: mockFetcher,
        bypassCache: true,
      });

      await cacheService.fetchWithCache({
        key,
        policy: CACHE_POLICIES.PRODUCTS_LISTING,
        fetcher: mockFetcher,
        bypassCache: true,
      });

      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });
  });
});
