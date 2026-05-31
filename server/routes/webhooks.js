const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { verifyWebhookSignature } = require('../middleware/webhookAuth');

// ── Rate limiting (built-in — no extra package needed) ──────────────────────
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 requests per IP per window

const ipRequestLog = new Map(); // { ip -> [timestamp, ...] }

function webhookRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  if (!ipRequestLog.has(ip)) {
    ipRequestLog.set(ip, []);
  }

  // Prune timestamps outside the window
  const timestamps = ipRequestLog
    .get(ip)
    .filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Too many webhook requests. Please try again later.',
    });
  }

  timestamps.push(now);
  ipRequestLog.set(ip, timestamps);

  // Cleanup old IPs every 5 minutes to prevent memory leaks
  if (Math.random() < 0.01) {
    for (const [key, ts] of ipRequestLog.entries()) {
      if (ts.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        ipRequestLog.delete(key);
      }
    }
  }

  next();
}

// ── Input validation ─────────────────────────────────────────────────────────
const ALLOWED_EVENTS = new Set([
  'room-created',
  'room-joined',
  'room-left',
  'code-executed',
  'room-closed',
]);

// Max field lengths to prevent oversized payloads
const MAX_FIELD_LENGTH = 256;

function validateWebhookPayload(req, res, next) {
  const { event, roomId, userName, passwordProtected } = req.body;

  // 1. Required fields
  if (!event || !roomId || !userName) {
    return res.status(400).json({
      error: 'Missing required fields: event, roomId, userName.',
    });
  }

  // 2. Allowlist event types — prevents injection of arbitrary event strings
  if (!ALLOWED_EVENTS.has(event)) {
    return res.status(400).json({
      error: `Invalid event type. Allowed: ${[...ALLOWED_EVENTS].join(', ')}.`,
    });
  }

  // 3. Type checks
  if (typeof roomId !== 'string' || typeof userName !== 'string') {
    return res.status(400).json({ error: 'roomId and userName must be strings.' });
  }

  // 4. Length limits — prevents oversized content from reaching Discord/Slack
  if (roomId.length > MAX_FIELD_LENGTH || userName.length > MAX_FIELD_LENGTH) {
    return res.status(400).json({
      error: `Fields exceed maximum length of ${MAX_FIELD_LENGTH} characters.`,
    });
  }

  // 5. Boolean check for passwordProtected
  if (passwordProtected !== undefined && typeof passwordProtected !== 'boolean') {
    return res.status(400).json({
      error: 'passwordProtected must be a boolean.',
    });
  }

  next();
}

// ── Mention/formatting neutraliser ──────────────────────────────────────────
/**
 * Escapes Discord/Slack special characters that could trigger mentions,
 * channel links, formatting abuse, or injection of embed fields.
 *
 * Discord: @everyone, @here, <@id>, <#id>, <@&role>
 * Slack:   <!channel>, <!here>, <!everyone>, <@user>
 */
function sanitizeForMessaging(str) {
  if (typeof str !== 'string') return String(str);

  return str
    // Neutralise Discord/Slack @mentions and special tokens
    .replace(/@(everyone|here|channel)/gi, '[@$1]')
    // Neutralise user/role/channel ID mentions: <@123>, <#123>, <@&123>
    .replace(/<(@[!&]?|#)\d+>/g, '[mention]')
    // Neutralise Slack special mentions
    .replace(/<!(\w+)>/g, '[!$1]')
    // Strip backtick code block injections that could break embed formatting
    .replace(/`{3}/g, "'''")
    // Trim whitespace
    .trim();
}

// ── Discord payload builder ──────────────────────────────────────────────────
function buildDiscordPayload(event, roomId, userName, passwordProtected) {
  const safeEvent = sanitizeForMessaging(event);
  const safeRoom = sanitizeForMessaging(roomId);
  const safeUser = sanitizeForMessaging(userName);
  const safePassword = passwordProtected ? '🔒 Yes' : '🔓 No';
  const timestamp = new Date().toISOString();

  return {
    embeds: [
      {
        title: `📡 Room Event: ${safeEvent}`,
        color: 0x6f9ceb,
        fields: [
          { name: 'Room ID', value: safeRoom, inline: true },
          { name: 'User', value: safeUser, inline: true },
          { name: 'Password Protected', value: safePassword, inline: true },
        ],
        footer: { text: 'Debugra Room Event' },
        timestamp,
      },
    ],
  };
}

// ── Slack payload builder ────────────────────────────────────────────────────
function buildSlackPayload(event, roomId, userName, passwordProtected) {
  const safeEvent = sanitizeForMessaging(event);
  const safeRoom = sanitizeForMessaging(roomId);
  const safeUser = sanitizeForMessaging(userName);
  const safePassword = passwordProtected ? '🔒 Yes' : '🔓 No';

  return {
    text: `*Room Event: ${safeEvent}*`,
    blocks: [
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Event:*\n${safeEvent}` },
          { type: 'mrkdwn', text: `*Room ID:*\n${safeRoom}` },
          { type: 'mrkdwn', text: `*User:*\n${safeUser}` },
          { type: 'mrkdwn', text: `*Password Protected:*\n${safePassword}` },
        ],
      },
    ],
  };
}

// ── POST /api/webhooks/room-event ─────────────────────────────────────────────
router.post(
  '/room-event',
  webhookRateLimiter, // 1. Rate limit first (cheapest check)
  verifyWebhookSignature, // 2. Verify HMAC signature
  validateWebhookPayload, // 3. Validate + sanitize input fields
  async (req, res) => {
    const { event, roomId, userName, passwordProtected = false } = req.body;

    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    const slackUrl = process.env.SLACK_WEBHOOK_URL;

    if (!discordUrl && !slackUrl) {
      return res.status(503).json({
        error: 'No webhook destinations configured on this server.',
      });
    }

    const results = [];
    const errors = [];

    // ── Send to Discord ──────────────────────────────────────────────────────
    if (discordUrl) {
      try {
        const discordRes = await fetch(discordUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildDiscordPayload(event, roomId, userName, passwordProtected)),
        });

        if (!discordRes.ok) {
          throw new Error(`Discord responded with ${discordRes.status}`);
        }
        results.push('discord');
      } catch (err) {
        console.error('[webhook] Discord dispatch error:', err.message);
        errors.push({ destination: 'discord', error: err.message });
      }
    }

    // ── Send to Slack ────────────────────────────────────────────────────────
    if (slackUrl) {
      try {
        const slackRes = await fetch(slackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildSlackPayload(event, roomId, userName, passwordProtected)),
        });

        if (!slackRes.ok) {
          throw new Error(`Slack responded with ${slackRes.status}`);
        }
        results.push('slack');
      } catch (err) {
        console.error('[webhook] Slack dispatch error:', err.message);
        errors.push({ destination: 'slack', error: err.message });
      }
    }

    // ── Respond ──────────────────────────────────────────────────────────────
    if (results.length === 0) {
      return res.status(502).json({
        error: 'Failed to dispatch to all webhook destinations.',
        details: errors,
      });
    }

    return res.status(200).json({
      success: true,
      dispatched: results,
      ...(errors.length > 0 && { partialErrors: errors }),
    });
  }
);

module.exports = router;
