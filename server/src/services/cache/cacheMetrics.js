/**
 * Cache Observability & Metrics Service.
 *
 * Tracks hit/miss rates, stale-while-revalidate serves, lease/locking contention,
 * and fallback counts across each cache namespace.
 */

class CacheMetrics {
  constructor() {
    this._metrics = new Map();
  }

  _getBucket(namespace = "default") {
    if (!this._metrics.has(namespace)) {
      this._metrics.set(namespace, {
        hitsFresh: 0,
        hitsStaleSwr: 0,
        misses: 0,
        leaseAcquired: 0,
        leaseContended: 0,
        leaseWaitSuccess: 0,
        leaseWaitTimeout: 0,
        backgroundRevalidations: 0,
        backgroundRevalidationErrors: 0,
      });
    }
    return this._metrics.get(namespace);
  }

  recordHit(namespace, isStale = false) {
    const b = this._getBucket(namespace);
    if (isStale) {
      b.hitsStaleSwr++;
    } else {
      b.hitsFresh++;
    }
  }

  recordMiss(namespace) {
    this._getBucket(namespace).misses++;
  }

  recordLeaseAcquired(namespace) {
    this._getBucket(namespace).leaseAcquired++;
  }

  recordLeaseContended(namespace) {
    this._getBucket(namespace).leaseContended++;
  }

  recordLeaseWaitSuccess(namespace) {
    this._getBucket(namespace).leaseWaitSuccess++;
  }

  recordLeaseWaitTimeout(namespace) {
    this._getBucket(namespace).leaseWaitTimeout++;
  }

  recordBackgroundRevalidation(namespace, isError = false) {
    const b = this._getBucket(namespace);
    if (isError) {
      b.backgroundRevalidationErrors++;
    } else {
      b.backgroundRevalidations++;
    }
  }

  getMetrics() {
    const result = {
      summary: {
        totalHits: 0,
        totalMisses: 0,
        totalStaleServed: 0,
        overallHitRate: "0.0%",
        totalLeaseAcquisitions: 0,
        totalLeaseContentions: 0,
      },
      byNamespace: {},
    };

    let totalHits = 0;
    let totalMisses = 0;
    let totalStale = 0;
    let totalLeaseAcq = 0;
    let totalLeaseCont = 0;

    for (const [ns, b] of this._metrics.entries()) {
      const hits = b.hitsFresh + b.hitsStaleSwr;
      const totalReq = hits + b.misses;
      const hitRate = totalReq > 0 ? ((hits / totalReq) * 100).toFixed(1) + "%" : "0.0%";

      result.byNamespace[ns] = {
        ...b,
        totalRequests: totalReq,
        hitRate,
      };

      totalHits += hits;
      totalMisses += b.misses;
      totalStale += b.hitsStaleSwr;
      totalLeaseAcq += b.leaseAcquired;
      totalLeaseCont += b.leaseContended;
    }

    const grandTotal = totalHits + totalMisses;
    result.summary.totalHits = totalHits;
    result.summary.totalMisses = totalMisses;
    result.summary.totalStaleServed = totalStale;
    result.summary.totalLeaseAcquisitions = totalLeaseAcq;
    result.summary.totalLeaseContentions = totalLeaseCont;
    result.summary.overallHitRate = grandTotal > 0 ? ((totalHits / grandTotal) * 100).toFixed(1) + "%" : "0.0%";

    return result;
  }

  reset() {
    this._metrics.clear();
  }
}

const cacheMetrics = new CacheMetrics();

module.exports = cacheMetrics;
