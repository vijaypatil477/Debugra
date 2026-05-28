const { rateLimit } = require('express-rate-limit');

function retryAfterSeconds(req) {
  const resetTime = req.rateLimit?.resetTime;
  return resetTime
    ? Math.max(1, Math.ceil((new Date(resetTime).getTime() - Date.now()) / 1000))
    : 60;
}

function createExecuteLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler(req, res) {
      const retryAfter = retryAfterSeconds(req);
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Compilation limit reached. You can run up to 10 compilations per minute.',
        retryAfter,
      });
    },
  });
}

function createAiLimiter() {
  return rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler(req, res) {
      const retryAfter = retryAfterSeconds(req);
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'AI request limit reached. You can make up to 5 AI requests per 5 minutes.',
        retryAfter,
      });
    },
  });
}

module.exports = {
  executeLimiter: createExecuteLimiter(),
  aiLimiter: createAiLimiter(),
  createExecuteLimiter,
  createAiLimiter,
};
