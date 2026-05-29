const express = require('express');
const { rateLimit } = require('express-rate-limit');
const logger = require('../utils/logger');

const router = express.Router();

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many feedback submissions. Please try again later.' },
});

const FEEDBACK_CATEGORIES = new Set(['suggestion', 'bug', 'experience', 'complaint', 'other']);

function trimValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/', feedbackLimiter, async (req, res, next) => {
  try {
    const name = trimValue(req.body?.name) || 'Anonymous';
    const email = trimValue(req.body?.email);
    const category = trimValue(req.body?.category) || 'suggestion';
    const message = trimValue(req.body?.message);
    const source = trimValue(req.body?.source) || 'website';
    const pageUrl = trimValue(req.body?.pageUrl);
    const userAgent = trimValue(req.body?.userAgent);
    const rating = Number.parseInt(req.body?.rating, 10);

    if (!message || message.length < 10) {
      return res.status(400).json({ error: 'Feedback message must be at least 10 characters long.' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Feedback message is too long.' });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!FEEDBACK_CATEGORIES.has(category)) {
      return res.status(400).json({ error: 'Invalid feedback category.' });
    }

    if (!Number.isNaN(rating) && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const payload = {
      name,
      email,
      category,
      rating: Number.isNaN(rating) ? null : rating,
      message,
      source,
      pageUrl,
      userAgent,
      submittedAt: new Date().toISOString(),
    };

    logger.info('[feedback] received submission', payload);

    const feedbackWebhookUrl = (process.env.FEEDBACK_WEBHOOK_URL || '').trim();
    if (feedbackWebhookUrl) {
      try {
        const response = await fetch(feedbackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          logger.warn(`[feedback] webhook responded with ${response.status}`);
        }
      } catch (error) {
        logger.warn(`[feedback] webhook delivery failed: ${error.message}`);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully.',
      submittedAt: payload.submittedAt,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
