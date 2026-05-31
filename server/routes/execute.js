const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const crypto = require('crypto');
const { rateLimit } = require('express-rate-limit');
const { executeCode } = require('../services/judge0Service');

const MAX_SOURCE_CODE_LENGTH = 100000;
const MAX_STDIN_LENGTH = 10000;

const MAX_EXECUTION_CACHE_KEYS = 100;

// Initialize cache with 5 minutes TTL and a hard entry cap.
const executeCache = new NodeCache({
  stdTTL: 300,
  maxKeys: MAX_EXECUTION_CACHE_KEYS,
  checkperiod: 60,
});
const executeCacheInsertionOrder = new Map();

function buildCacheKey(languageId, stdin, sourceCode) {
  const payload = JSON.stringify({
    languageId,
    stdin: stdin || '',
    sourceCode,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function pruneExecutionCacheForInsert(cacheKey) {
  if (executeCache.has(cacheKey)) {
    return;
  }

  while (executeCache.keys().length >= MAX_EXECUTION_CACHE_KEYS) {
    const oldestKey = executeCacheInsertionOrder.keys().next().value;
    if (!oldestKey) {
      break;
    }
    executeCacheInsertionOrder.delete(oldestKey);
    executeCache.del(oldestKey);
  }
}

function cacheExecutionResult(cacheKey, result) {
  pruneExecutionCacheForInsert(cacheKey);
  executeCache.set(cacheKey, result);
  executeCacheInsertionOrder.set(cacheKey, Date.now());
}

// Stricter rate limiter specific to /api/execute
const executeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many execution requests, please try again later.',
    });
  },
});

router.post('/', executeLimiter, async (req, res, next) => {
  try {
    const { source_code, language_id, stdin } = req.body;

    if (!source_code || !language_id) {
      return res.status(400).json({ error: 'source_code and language_id are required' });
    }

    if (typeof source_code !== 'string' || (stdin !== undefined && typeof stdin !== 'string')) {
      return res.status(400).json({ error: 'source_code and stdin must be strings' });
    }

    if (Buffer.byteLength(source_code, 'utf-8') > MAX_SOURCE_CODE_LENGTH) {
      return res.status(413).json({
        error: `source_code exceeds maximum length of ${MAX_SOURCE_CODE_LENGTH} bytes`,
      });
    }

    const normalizedStdin = stdin || '';

    if (Buffer.byteLength(normalizedStdin, 'utf-8') > MAX_STDIN_LENGTH) {
      return res.status(413).json({
        error: `stdin exceeds maximum length of ${MAX_STDIN_LENGTH} bytes`,
      });
    }

    const cacheKey = buildCacheKey(language_id, normalizedStdin, source_code);
    const cachedResult = executeCache.get(cacheKey);

    if (cachedResult) {
      console.log('[Cache Hit] Serving cached execution result');
      return res.json(cachedResult);
    }

    const result = await executeCode(source_code, language_id, normalizedStdin);

    // Only cache successful requests
    if (result && result.status) {
      cacheExecutionResult(cacheKey, result);
    }

    res.json(result);
  } catch (err) {
    console.error('Judge0 error:', err.response?.data || err.message);
    next(err);
  }
});

module.exports = router;
