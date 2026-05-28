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
router.post('/explain-error', handleCachedRequest(async (body, apiKey) => {
  const { code, error, language, systemPrompt } = body;
  return await explainError(code, error, language, apiKey, systemPrompt);
}));

// Code fix
router.post('/fix-code', handleCachedRequest(async (body, apiKey) => {
  const { code, error, language, systemPrompt } = body;
  return await fixCodeAI(code, error, language, apiKey, systemPrompt);
}));

// Logic explanation
router.post('/explain-logic', handleCachedRequest(async (body, apiKey) => {
  const { code, language, systemPrompt } = body;
  return await explainLogicAI(code, language, apiKey, systemPrompt);
}));

// Test case generation
router.post('/generate-tests', handleCachedRequest(async (body, apiKey) => {
  const { code, language, systemPrompt } = body;
  return await generateTestsAI(code, language, apiKey, systemPrompt);
}));

// Security and refactoring audit
router.post('/audit-code', handleCachedRequest(async (body, apiKey) => {
  const { code, language, systemPrompt } = body;
  return await auditCodeAI(code, language, apiKey, systemPrompt);
}));

// Execution visualization
router.post('/visualize', handleCachedRequest(async (body, apiKey) => {
  const { code, language, input, systemPrompt } = body;
  return await visualizeAI(code, language, input, apiKey, systemPrompt);
}));

// AI Code Explainer — explain selected snippet
router.post('/explain-snippet', handleCachedRequest(async (body, apiKey) => {
  const { code, language, systemPrompt } = body;
  return await explainCodeSnippetAI(code, language, apiKey, systemPrompt);
}));

// AI Code Explainer — follow-up Q&A
router.post('/ask-followup', handleCachedRequest(async (body, apiKey) => {
  const { code, language, question, previousExplanation, systemPrompt } = body;
  return await askFollowUpAI(code, language, question, previousExplanation, apiKey, systemPrompt);
}));

module.exports = router;
