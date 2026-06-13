const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const crypto = require('crypto');
const {
  explainError,
  fixCodeAI,
  explainLogicAI,
  generateTestsAI,
  reviewCodeAI,
  auditCodeAI,
  visualizeAI,
  explainCodeSnippetAI,
  askFollowUpAI,
  analyzeComplexityAI,
} = require('../services/groqService');

// Initialize cache with 1 hour TTL to reduce redundant LLM calls
// ──────────────────────────────────────────────
// Input validation middleware for all AI endpoints
// ──────────────────────────────────────────────

const MAX_CODE_LENGTH = 50000;
const MAX_PROMPT_LENGTH = 50000;

function validateAiInput(req, res, next) {
  if (!req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }

  const { code, error, language, question, previousExplanation, input } = req.body;

  const stringFields = { code, error, language, question, previousExplanation, input };
  for (const [key, value] of Object.entries(stringFields)) {
    if (value !== undefined && value !== null && typeof value !== 'string') {
      return res.status(400).json({ error: `${key} must be a string` });
    }
  }

  if (code && Buffer.byteLength(code, 'utf-8') > MAX_CODE_LENGTH) {
    return res.status(413).json({ error: `code exceeds maximum length of ${MAX_CODE_LENGTH} bytes` });
  }

  if (question && Buffer.byteLength(question, 'utf-8') > MAX_PROMPT_LENGTH) {
    return res.status(413).json({ error: `question exceeds maximum length of ${MAX_PROMPT_LENGTH} bytes` });
  }

  if (previousExplanation && Buffer.byteLength(previousExplanation, 'utf-8') > MAX_PROMPT_LENGTH) {
    return res.status(413).json({ error: `previousExplanation exceeds maximum length of ${MAX_PROMPT_LENGTH} bytes` });
  }

  for (const key of Object.keys(req.body)) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }
  }

  next();
}

const MAX_AI_CACHE_KEYS = 500;
const aiCache = new NodeCache({ stdTTL: 3600, maxKeys: MAX_AI_CACHE_KEYS, checkperiod: 600 });
const aiCacheInsertionOrder = new Map();

aiCache.on('del', (key) => {
  aiCacheInsertionOrder.delete(key);
});
aiCache.on('expired', (key) => {
  aiCacheInsertionOrder.delete(key);
});

function pruneAiCacheForInsert(cacheKey) {
  if (aiCache.has(cacheKey)) {
    return;
  }

  while (aiCache.keys().length >= MAX_AI_CACHE_KEYS) {
    const oldestKey = aiCacheInsertionOrder.keys().next().value;
    if (!oldestKey) {
      break;
    }
    aiCacheInsertionOrder.delete(oldestKey);
    aiCache.del(oldestKey);
  }
}

function getUserGroqApiKey(req) {
  const apiKey = String(req.get('x-groq-api-key') || '').trim();
  return apiKey.length >= 20 ? apiKey : '';
}

function getApiKeyFingerprint(apiKey) {
  return apiKey
    ? crypto.createHash('sha256').update(apiKey).digest('hex').slice(0, 16)
    : 'server-key';
}

// Helper middleware to handle cached AI requests
const handleCachedRequest = (actionFn) => async (req, res, next) => {
  try {
    const apiKey = getUserGroqApiKey(req);
    // Build a stable hash from the request body instead of embedding raw JSON
    const sanitizedBody = {
      code: req.body.code,
      error: req.body.error,
      language: req.body.language,
      question: req.body.question,
      previousExplanation: req.body.previousExplanation,
      input: req.body.input
    };
    const bodyHash = crypto.createHash('sha256').update(JSON.stringify(sanitizedBody)).digest('hex');
    const cacheKey = `${req.path}_${getApiKeyFingerprint(apiKey)}_${bodyHash}`;
    
    // Check if we have a cached response
    const cachedResponse = aiCache.get(cacheKey);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }
    
    // Process request if not cached
    const result = await actionFn(req.body, apiKey);
    
    // Cache the successful result — stats tracking for eviction awareness
    const stats = aiCache.getStats();
    if (stats.evictions > 0) {
      console.log(`[Cache] Evictions: ${stats.evictions}, Keys: ${Object.keys(aiCache.keys()).length}`);
    }
    pruneAiCacheForInsert(cacheKey);
    aiCache.set(cacheKey, result);
    aiCacheInsertionOrder.set(cacheKey, Date.now());
    
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Error explanation
router.post('/explain-error', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, error, language, model } = body;
  return await explainError(code, error, language, apiKey, model);
}));

// Code fix
router.post('/fix-code', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, error, language, model } = body;
  return await fixCodeAI(code, error, language, apiKey, model);
}));

// Logic explanation
router.post('/explain-logic', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, language, model } = body;
  return await explainLogicAI(code, language, apiKey, model);
}));

// Test case generation
router.post('/generate-tests', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, language, model } = body;
  return await generateTestsAI(code, language, apiKey, model);
}));

// Security and refactoring audit
router.post('/audit-code', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, language, model } = body;
  return await auditCodeAI(code, language, apiKey, model);
}));

// Execution visualization
router.post('/visualize', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, language, input, model } = body;
  return await visualizeAI(code, language, input, apiKey, model);
}));

// AI Code Explainer — explain selected snippet
router.post('/explain-snippet', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, language, model } = body;
  return await explainCodeSnippetAI(code, language, apiKey, model);
}));

// AI Code Explainer — follow-up Q&A
router.post('/ask-followup', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, language, question, previousExplanation, model } = body;
  return await askFollowUpAI(code, language, question, previousExplanation, apiKey, model);
}));

// Big-O Complexity Analysis
router.post('/analyze-complexity', handleCachedRequest(async (body, apiKey) => {
  const { code, language } = body;
  return await analyzeComplexityAI(code, language, apiKey);
}));

module.exports = router;

