/**
 * Redis client — Phase 21 (Redis-backed rate limiting).
 *
 * Resolution strategy:
 *   - NODE_ENV === "test"  → always use the lightweight in-memory stub.
 *     Tests must run without a running Redis server. The stub exposes the
 *     same pipeline / sorted-set API surface so the rate limiter code is
 *     identical in both environments.
 *   - Everything else     → use a real ioredis connection (REDIS_URL or
 *     default redis://127.0.0.1:6379).  This is the cross-process store
 *     that Phase 21 requires.
 */

// ─── In-memory stub for NODE_ENV=test ────────────────────────────────────────
class InMemoryRedisStub {
  constructor() {
    this._store = new Map(); // key → Map<member, score>
  }

  _getSet(key) {
    if (!this._store.has(key)) this._store.set(key, new Map());
    return this._store.get(key);
  }

  async zremrangebyscore(key, min, max) {
    const s = this._getSet(key);
    for (const [member, score] of s) {
      if (score >= min && score <= max) s.delete(member);
    }
    return 0;
  }

  async zcard(key) {
    return this._getSet(key).size;
  }

  async zadd(key, score, member) {
    this._getSet(key).set(member, score);
    return 1;
  }

  async zrange(key, start, stop) {
    const s = this._getSet(key);
    // Sort elements by score (value of Map is score)
    const sorted = [...s.entries()].sort((a, b) => a[1] - b[1]);
    const members = sorted.map(entry => entry[0]);
    return members.slice(start, stop === -1 ? undefined : stop + 1);
  }

  async pexpire(_key, _ms) {
    return 1; // no-op in memory
  }

  async flushdb() {
    this._store.clear();
    return "OK";
  }

  /**
   * Returns a fake pipeline that collects commands then executes them
   * sequentially, returning [null, value] pairs matching ioredis format.
   */
  multi() {
    const cmds = [];
    const stub = this;
    const pipeline = {
      zremrangebyscore: (key, min, max) => { cmds.push(["zremrangebyscore", key, min, max]); return pipeline; },
      zcard:            (key)            => { cmds.push(["zcard",            key]);             return pipeline; },
      zadd:             (key, sc, mem)   => { cmds.push(["zadd",             key, sc, mem]);   return pipeline; },
      zrange:           (key, start, st) => { cmds.push(["zrange",           key, start, st]);  return pipeline; },
      pexpire:          (key, ms)        => { cmds.push(["pexpire",          key, ms]);         return pipeline; },
      exec: async () => {
        const results = [];
        for (const [cmd, ...args] of cmds) {
          results.push([null, await stub[cmd](...args)]);
        }
        return results;
      },
    };
    return pipeline;
  }

  on() { return this; } // no-op — stub has no event emitter
}

// ─── Choose backend ───────────────────────────────────────────────────────────
const isTest = process.env.NODE_ENV === "test";

let redisClient;

if (isTest) {
  redisClient = new InMemoryRedisStub();
} else {
  const Redis = require("ioredis");
  redisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: 3,
  });

  redisClient.on("connect", () => {
    console.log("[Redis] Connected successfully.");
  });

  redisClient.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });
}

module.exports = redisClient;
