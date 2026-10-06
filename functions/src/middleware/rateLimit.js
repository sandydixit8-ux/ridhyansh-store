/**
 * Minimal in-memory sliding-window rate limiter for request endpoints.
 * Single-instance Cloud Functions with few concurrent instances at this
 * scale - good enough for M2-M4. Revisit (Redis/shared state) only if the
 * store grows multi-region or sees sustained abuse.
 *
 * Usage:
 *   router.post("/", rl("order", 5, 60000), handler)  // 5 calls/60s
 */
const hits = new Map();
const WINDOWS = new Map();

function rateLimit(name, limit, windowMs) {
  return function (req, res, next) {
    const key = name + ":" + (req.routeKey || (req.ip || "anon"));
    const now = Date.now();
    const bucket = hits.get(key) || [];
    const until = WINDOWS.get(key) || 0;

    if (now < until) {
      res.status(429).json({ error: "rate_limited", retryInMs: until - now });
      return;
    }
    const fresh = bucket.filter(function (t) { return now - t < windowMs; });
    fresh.push(now);
    hits.set(key, fresh);
    if (fresh.length > limit) {
      WINDOWS.set(key, now + 5000); // brief 5s cooler once exhausted
      res.status(429).json({ error: "rate_limited", retryInMs: 5000 });
      return;
    }
    // crude memory hygiene
    if (hits.size > 5000) {
      hits.forEach(function (v, k) {
        if ((v[v.length - 1] || 0) < now - windowMs) hits.delete(k);
      });
    }
    next();
  };
}

module.exports = { rateLimit };