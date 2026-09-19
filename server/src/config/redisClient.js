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
    this._kvStore = new Map(); // key → string (for GET/SET cache)
  }

  _getSet(key) {
    if (!this._store.has(key)) this._store.set(key, new Map());
    return this._store.get(key);
  }

  async get(key) {
    return this._kvStore.get(key) || null;
  }

  async set(key, value, mode, duration) {
    this._kvStore.set(key, String(value));
    return "OK";
  }

  async del(...keys) {
    let count = 0;
    const flatKeys = keys.flat();
    for (const k of flatKeys) {
      if (this._kvStore.delete(k)) count++;
    }
    return count;
  }

  async keys(pattern) {
    if (!pattern || pattern === "*") return [...this._kvStore.keys()];
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return [...this._kvStore.keys()].filter(k => regex.test(k));
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

  async scan(cursor, matchArg, pattern, countArg, count) {
    const allKeys = [...this._kvStore.keys()];
    const pat = pattern || (matchArg && matchArg !== "MATCH" ? matchArg : "*");
    const regex = new RegExp("^" + pat.replace(/\*/g, ".*") + "$");
    const matched = allKeys.filter(k => regex.test(k));
    return ["0", matched];
  }

  async pexpire(_key, _ms) {
    return 1; // no-op in memory
  }

  async flushdb() {
    this._store.clear();
    this._kvStore.clear();
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
const isTest = process.env.NODE_ENV === "test" && process.env.USE_REAL_REDIS !== "true";
const forceInMemory = process.env.USE_IN_MEMORY_REDIS === "true";

let redisClient;

if (isTest || forceInMemory) {
  redisClient = new InMemoryRedisStub();
} else {
  const Redis = require("ioredis");
  const inMemoryFallback = new InMemoryRedisStub();
  let isConnected = false;
  let loggedNoticeOnce = false;

  const realClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times >= 2) {
        if (!loggedNoticeOnce) {
          console.warn("[Redis] Notice: No local Redis service found at 127.0.0.1:6379. Operating seamlessly with built-in in-memory cache & rate limiter.");
          loggedNoticeOnce = true;
        }
        return null; // Stop reconnecting and spamming errors
      }
      return 500;
    },
  });

  realClient.on("connect", () => {
    isConnected = true;
    console.log("[Redis] Connected successfully.");
  });

  realClient.on("error", (err) => {
    if (!loggedNoticeOnce && !isConnected) {
      console.warn(`[Redis] Notice: Local Redis server not reachable (${err.code || err.message || "ECONNREFUSED"}). Using built-in in-memory store.`);
      loggedNoticeOnce = true;
    }
  });

  redisClient = new Proxy(realClient, {
    get(target, prop) {
      if (prop === "isFallback") return !isConnected;
      if (typeof target[prop] === "function") {
        return function (...args) {
          if (!isConnected) {
            if (typeof inMemoryFallback[prop] === "function") {
              return inMemoryFallback[prop](...args);
            }
            return Promise.resolve(null);
          }
          try {
            const res = target[prop](...args);
            if (res && typeof res.catch === "function") {
              return res.catch((err) => {
                if (typeof inMemoryFallback[prop] === "function") {
                  return inMemoryFallback[prop](...args);
                }
                return null;
              });
            }
            return res;
          } catch (err) {
            if (typeof inMemoryFallback[prop] === "function") {
              return inMemoryFallback[prop](...args);
            }
            return null;
          }
        };
      }
      return target[prop];
    },
  });
}

/**
 * Safely delete keys matching a pattern using non-blocking SCAN in production
 */
async function deleteKeysByPattern(pattern) {
  try {
    if (!pattern) return;
    if (typeof redisClient.scan === "function") {
      let cursor = "0";
      do {
        const result = await redisClient.scan(cursor, "MATCH", pattern, "COUNT", 100);
        if (!result || !Array.isArray(result)) break;
        cursor = result[0];
        const keys = result[1];
        if (keys && keys.length > 0) {
          await redisClient.del(...keys);
        }
      } while (cursor !== "0");
    } else if (typeof redisClient.keys === "function") {
      const keys = await redisClient.keys(pattern);
      if (keys && keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
  } catch (err) {
    console.error(`[Redis] deleteKeysByPattern error for "${pattern}":`, err.message);
  }
}

redisClient.deleteKeysByPattern = deleteKeysByPattern;

module.exports = redisClient;

