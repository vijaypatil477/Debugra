const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const crypto = require('crypto');
const { executeCode, SUPPORTED_LANGUAGE_IDS } = require('../services/judge0Service');

// Initialize cache with 5 minutes TTL for code execution
const executeCache = new NodeCache({ stdTTL: 300 });

const MAX_SOURCE_CODE_LENGTH = 50000;
const MAX_STDIN_LENGTH = 10000;

router.post('/', async (req, res, next) => {
  try {
    const { source_code, language_id, stdin } = req.body;

    if (!source_code || !language_id) {
      return res.status(400).json({ error: 'source_code and language_id are required' });
    }

    if (source_code.length > MAX_SOURCE_CODE_LENGTH) {
      return res.status(413).json({ error: 'source_code exceeds maximum allowed length' });
    }

    const parsedId = Number(language_id);
    if (!Number.isInteger(parsedId) || !SUPPORTED_LANGUAGE_IDS.has(parsedId)) {
      return res.status(400).json({
        error: `Unsupported language_id: ${language_id}. Supported IDs: ${[...SUPPORTED_LANGUAGE_IDS].join(', ')}`,
      });
    }

    if (stdin && stdin.length > MAX_STDIN_LENGTH) {
      return res.status(413).json({ error: 'stdin exceeds maximum allowed length of 10,000 characters' });
    }

    const sourceHash = crypto.createHash('sha256').update(source_code).digest('hex');
    const stdinHash = crypto.createHash('sha256').update(stdin || '').digest('hex');
    const cacheKey = `exec_${parsedId}_${stdinHash}_${sourceHash}`;
    const cachedResult = executeCache.get(cacheKey);
    
    if (cachedResult) {
      console.log('[Cache Hit] Serving cached execution result');
      return res.json(cachedResult);
    }

    const result = await executeCode(source_code, parsedId, stdin || '');
    
    // Only cache successful requests
    if (result && result.status) {
      executeCache.set(cacheKey, result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('Judge0 error:', err.response?.data || err.message);
    next(err);
  }
});

module.exports = router;
