/**
 * Cache Service — Lease/Locking & Stale-While-Revalidate Engine.
 *
 * Implements:
 * 1. SET key token NX PX <duration> distributed locking to prevent cache stampedes.
 * 2. Stale-While-Revalidate (SWR) pattern to serve cached data past fresh TTL
 *    while regenerating in the background.
 * 3. Double-read and adaptive polling for contended requests on cold keys.
 * 4. Zero stale data leakage into checkout, payments, or security boundaries.
 */

const redisClient = require("../../config/redisClient");
const { CACHE_POLICIES } = require("../../config/cachePolicy");
const cacheMetrics = require("./cacheMetrics");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const RELEASE_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

class CacheService {
  constructor() {
    this._inFlightRevalidations = new Set();
  }

  /**
   * Acquire a distributed lease/lock using atomic SET NX PX
   */
  async acquireLock(lockKey, token, lockDurationMs = 2500) {
    try {
      const res = await redisClient.set(lockKey, token, "PX", lockDurationMs, "NX");
      return res === "OK";
    } catch (err) {
      console.warn(`[CacheLock] Failed to acquire lock ${lockKey}:`, err.message);
      return false;
    }
  }

  /**
   * Safely release a distributed lock only if token matches
   */
  async releaseLock(lockKey, token) {
    try {
      if (typeof redisClient.eval === "function") {
        await redisClient.eval(RELEASE_LOCK_LUA, 1, lockKey, token);
      } else {
        const current = await redisClient.get(lockKey);
        if (current === token) {
          await redisClient.del(lockKey);
        }
      }
    } catch (err) {
      console.warn(`[CacheLock] Error releasing lock ${lockKey}:`, err.message);
    }
  }

  /**
   * Write data to cache with SWR envelope and physical TTL
   */
  async writeCache(cacheKey, data, policy) {
    try {
      const envelope = {
        __swrEnvelope: true,
        data,
        cachedAt: Date.now(),
        freshTtlMs: policy.freshTtlMs,
        staleTtlMs: policy.staleTtlMs,
      };

      // Physical Redis TTL is the full stale window (in seconds)
      const physicalTtlMs = policy.staleTtlMs || policy.freshTtlMs || 60000;
      const physicalTtlSec = Math.max(1, Math.ceil(physicalTtlMs / 1000));

      await redisClient.set(cacheKey, JSON.stringify(envelope), "EX", physicalTtlSec);
    } catch (err) {
      console.error(`[Cache] Write error for ${cacheKey}:`, err.message);
    }
  }

  /**
   * Asynchronously revalidate cache in background without blocking the user
   */
  triggerBackgroundRevalidation(cacheKey, fetcher, policy) {
    if (this._inFlightRevalidations.has(cacheKey)) return;
    this._inFlightRevalidations.add(cacheKey);

    setImmediate(async () => {
      const lockKey = `lock:reval:${cacheKey}`;
      const token = `reval:${Date.now()}:${Math.random().toString(36).slice(2)}`;
      try {
        const lockAcquired = await this.acquireLock(lockKey, token, policy.lockDurationMs || 3000);
        if (!lockAcquired) return;

        try {
          const freshData = await fetcher();
          await this.writeCache(cacheKey, freshData, policy);
          cacheMetrics.recordBackgroundRevalidation(policy.namespace, false);
          if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
            console.log(`[Cache SWR] Background revalidation completed for ${cacheKey}`);
          }
        } finally {
          await this.releaseLock(lockKey, token);
        }
      } catch (err) {
        cacheMetrics.recordBackgroundRevalidation(policy.namespace, true);
        console.warn(`[Cache SWR] Background revalidation failed for ${cacheKey}:`, err.message);
      } finally {
        this._inFlightRevalidations.delete(cacheKey);
      }
    });
  }

  /**
   * Main caching entry point:
   * Combines SWR, lease/lock stampede protection, and graceful degradation.
   *
   * @param {Object} options
   * @param {string} options.key - Redis cache key
   * @param {Object} options.policy - Cache policy from CACHE_POLICIES
   * @param {Function} options.fetcher - Async function returning fresh data if missed
   * @param {boolean} [options.bypassCache=false] - If true, bypass cache and fetch directly
   * @returns {Promise<any>} The cached or freshly computed data
   */
  async fetchWithCache({ key, policy, fetcher, bypassCache = false }) {
    if (bypassCache || !policy || policy.freshTtlMs === 0) {
      return await fetcher();
    }

    let staleFallbackData = null;

    // ─── 1. Attempt Cache Read ────────────────────────────────────────────────
    try {
      const rawCached = await redisClient.get(key);
      if (rawCached) {
        const envelope = JSON.parse(rawCached);
        const data = envelope && envelope.__swrEnvelope ? envelope.data : envelope;
        const cachedAt = envelope && envelope.cachedAt ? envelope.cachedAt : Date.now();
        const freshTtlMs = envelope && envelope.freshTtlMs ? envelope.freshTtlMs : policy.freshTtlMs;
        const staleTtlMs = envelope && envelope.staleTtlMs ? envelope.staleTtlMs : policy.staleTtlMs;
        const age = Date.now() - cachedAt;

        // Fresh Hit
        if (age <= freshTtlMs) {
          cacheMetrics.recordHit(policy.namespace, false);
          if (process.env.NODE_ENV !== "production") {
            console.log(`[Cache HIT] key=${key} (fresh, age: ${Math.round(age / 1000)}s)`);
          }
          return data;
        }

        // Stale but Usable (Stale-While-Revalidate window)
        if (policy.enableSwr && age <= staleTtlMs) {
          cacheMetrics.recordHit(policy.namespace, true);
          if (process.env.NODE_ENV !== "production") {
            console.log(`[Cache SWR HIT] key=${key} (serving stale, age: ${Math.round(age / 1000)}s, trigger background refresh)`);
          }
          this.triggerBackgroundRevalidation(key, fetcher, policy);
          return data;
        }

        // Past stale window, but keep reference for emergency lock contention fallback
        if (policy.allowStaleFallback) {
          staleFallbackData = data;
        }
      }
    } catch (err) {
      console.warn(`[Cache] Read error for ${key}:`, err.message);
    }

    // ─── 2. Cache Miss: Stampede Lease / Lock Protection ───────────────────────
    cacheMetrics.recordMiss(policy.namespace);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Cache MISS] key=${key}`);
    }

    // If stampede locking is disabled for this key, fetch directly and cache
    if (!policy.enableLocking) {
      const freshData = await fetcher();
      await this.writeCache(key, freshData, policy);
      return freshData;
    }

    // Attempt to acquire lease
    const lockKey = `lock:${key}`;
    const token = `lease:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const lockDurationMs = policy.lockDurationMs || 2500;
    const isWinner = await this.acquireLock(lockKey, token, lockDurationMs);

    // ─── 2A. Lock Acquired (Winner): Regenerate from MongoDB ──────────────────
    if (isWinner) {
      cacheMetrics.recordLeaseAcquired(policy.namespace);
      try {
        const freshData = await fetcher();
        await this.writeCache(key, freshData, policy);
        return freshData;
      } finally {
        await this.releaseLock(lockKey, token);
      }
    }

    // ─── 2B. Lock Contended (Follower): Another request is regenerating ────────
    cacheMetrics.recordLeaseContended(policy.namespace);

    // If we have stale data and policy allows it, serve immediately instead of waiting!
    if (staleFallbackData && policy.allowStaleFallback) {
      cacheMetrics.recordHit(policy.namespace, true);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Cache SWR] Served stale fallback during lease contention for ${key}`);
      }
      return staleFallbackData;
    }

    // Otherwise (cold cache, no stale data): Double-check & poll briefly
    const maxWaitMs = 500;
    const pollIntervalMs = 35;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      await sleep(pollIntervalMs);
      try {
        const polledCached = await redisClient.get(key);
        if (polledCached) {
          const envelope = JSON.parse(polledCached);
          const data = envelope && envelope.__swrEnvelope ? envelope.data : envelope;
          cacheMetrics.recordLeaseWaitSuccess(policy.namespace);
          if (process.env.NODE_ENV !== "production") {
            console.log(`[Cache LEASE_RESOLVED] key=${key} in ${Date.now() - startTime}ms`);
          }
          return data;
        }
      } catch (_) {}
    }

    // ─── 2C. Fallback Safety Valve ────────────────────────────────────────────
    // If waiting timed out, query database directly as a last resort
    cacheMetrics.recordLeaseWaitTimeout(policy.namespace);
    console.warn(`[Cache LOCK_TIMEOUT] Timed out waiting for ${key}; falling back to direct DB read.`);
    return await fetcher();
  }
}

const cacheService = new CacheService();

module.exports = {
  cacheService,
  CACHE_POLICIES,
};
