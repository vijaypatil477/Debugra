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

const aiCache = new NodeCache({ stdTTL: 3600, maxKeys: 500, checkperiod: 600 });

function getUserGroqApiKey(req) {
  const apiKey = String(req.get('x-groq-api-key') || '').trim();
  return apiKey.length >= 20 ? apiKey : '';
}

function getApiKeyFingerprint(apiKey) {
  return apiKey
    ? crypto.createHash('sha256').update(apiKey).digest('hex').slice(0, 16)
    : 'server-key';
}

// Helper middleware to handle streaming AI requests with event-stream and cache
const handleStreamingRequest = (serviceFn, isJson = true) => async (req, res, next) => {
  try {
    const apiKey = getUserGroqApiKey(req);
    const bodyHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
    const cacheKey = `${req.path}_${getApiKeyFingerprint(apiKey)}_${bodyHash}`;
    
    // Check if we have a cached response
    const cachedResponse = aiCache.get(cacheKey);
    if (cachedResponse) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('x-no-compression', 'true');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();
      
      const textToWrite = typeof cachedResponse === 'string' 
        ? cachedResponse 
        : JSON.stringify(cachedResponse.content || cachedResponse);
      res.write(textToWrite);
      if (typeof res.flush === 'function') {
        res.flush();
      }
      res.end();
      return;
    }
    
    // Set up headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('x-no-compression', 'true');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let accumulated = '';
    
    // Call service function with onChunk callback
    await serviceFn(req.body, apiKey, (chunk) => {
      accumulated += chunk;
      res.write(chunk);
      if (typeof res.flush === 'function') {
        res.flush();
      }
    });

    // Cache the accumulated raw text response
    aiCache.set(cacheKey, accumulated);

    res.end();
  } catch (err) {
    if (!res.headersSent) {
      next(err);
    } else {
      console.error('Error during streaming:', err);
      res.end();
    }
  }
};

// Error explanation
router.post('/explain-error', validateAiInput, handleStreamingRequest(async (body, apiKey, onChunk) => {
  const { code, error, language, model } = body;
  await explainError(code, error, language, apiKey, model, onChunk);
}));

// Code fix
router.post('/fix-code', validateAiInput, handleStreamingRequest(async (body, apiKey, onChunk) => {
  const { code, error, language, model } = body;
  await fixCodeAI(code, error, language, apiKey, model, onChunk);
}, false));

// Logic explanation
router.post('/explain-logic', validateAiInput, handleStreamingRequest(async (body, apiKey, onChunk) => {
  const { code, language, model } = body;
  await explainLogicAI(code, language, apiKey, model, onChunk);
}));

// Test case generation
router.post('/generate-tests', validateAiInput, handleStreamingRequest(async (body, apiKey, onChunk) => {
  const { code, language, model } = body;
  await generateTestsAI(code, language, apiKey, model, onChunk);
}));

// Security and refactoring audit
router.post('/audit-code', validateAiInput, handleStreamingRequest(async (body, apiKey, onChunk) => {
  const { code, language, model } = body;
  await auditCodeAI(code, language, apiKey, model, onChunk);
}));

// Execution visualization
router.post('/visualize', validateAiInput, handleStreamingRequest(async (body, apiKey, onChunk) => {
  const { code, language, input, model } = body;
  await visualizeAI(code, language, input, apiKey, model, onChunk);
}));

// AI Code Explainer — explain selected snippet
router.post('/explain-snippet', validateAiInput, handleStreamingRequest(async (body, apiKey, onChunk) => {
  const { code, language, model } = body;
  await explainCodeSnippetAI(code, language, apiKey, model, onChunk);
}));

// AI Code Explainer — follow-up Q&A
router.post('/ask-followup', validateAiInput, handleStreamingRequest(async (body, apiKey, onChunk) => {
  const { code, language, question, previousExplanation, model } = body;
  await askFollowUpAI(code, language, question, previousExplanation, apiKey, model, onChunk);
}));

// Big-O Complexity Analysis
router.post('/analyze-complexity', handleStreamingRequest(async (body, apiKey, onChunk) => {
  const { code, language } = body;
  await analyzeComplexityAI(code, language, apiKey, onChunk);
}));

module.exports = router;
