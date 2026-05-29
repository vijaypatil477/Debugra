const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const crypto = require('crypto');
const {
  explainError,
  fixCodeAI,
  explainLogicAI,
  generateTestsAI,
  auditCodeAI,
  visualizeAI,
  explainCodeSnippetAI,
  askFollowUpAI,
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
      return res.status(400).json({ error: ${key} must be a string });
    }
  }

  if (code && Buffer.byteLength(code, 'utf-8') > MAX_CODE_LENGTH) {
    return res.status(413).json({ error: code exceeds maximum length of  bytes });
  }

  if (question && Buffer.byteLength(question, 'utf-8') > MAX_PROMPT_LENGTH) {
    return res.status(413).json({ error: question exceeds maximum length of  bytes });
  }

  if (previousExplanation && Buffer.byteLength(previousExplanation, 'utf-8') > MAX_PROMPT_LENGTH) {
    return res.status(413).json({ error: previousExplanation exceeds maximum length of  bytes });
  }

  for (const key of Object.keys(req.body)) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }
  }

  next();
}

const aiCache = new NodeCache({ stdTTL: 3600 });

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
    // Create a unique cache key based on route path and request body
    const cacheKey = `${req.path}_${getApiKeyFingerprint(apiKey)}_${JSON.stringify(req.body)}`;
    
    // Check if we have a cached response
    const cachedResponse = aiCache.get(cacheKey);
    if (cachedResponse) {
      console.log(`[Cache Hit] Serving cached AI response for ${req.path}`);
      return res.json(cachedResponse);
    }
    
    // Process request if not cached
    const result = await actionFn(req.body, apiKey);
    
    // Cache the successful result
    aiCache.set(cacheKey, result);
    
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Error explanation
router.post('/explain-error', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, error, language } = body;
  return await explainError(code, error, language, apiKey);
}));

// Code fix
router.post('/fix-code', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, error, language } = body;
  return await fixCodeAI(code, error, language, apiKey);
}));

// Logic explanation
router.post('/explain-logic', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, language } = body;
  return await explainLogicAI(code, language, apiKey);
}));

// Test case generation
router.post('/generate-tests', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, language } = body;
  return await generateTestsAI(code, language, apiKey);
}));

// Security and refactoring audit
router.post('/audit-code', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, language } = body;
  return await auditCodeAI(code, language, apiKey);
}));

// Execution visualization
router.post('/visualize', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, language, input } = body;
  return await visualizeAI(code, language, input, apiKey);
}));

// AI Code Explainer — explain selected snippet
router.post('/explain-snippet', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, language } = body;
  return await explainCodeSnippetAI(code, language, apiKey);
}));

// AI Code Explainer — follow-up Q&A
router.post('/ask-followup', validateAiInput, handleCachedRequest(async (body, apiKey) => {
  const { code, language, question, previousExplanation } = body;
  return await askFollowUpAI(code, language, question, previousExplanation, apiKey);
}));

module.exports = router;
