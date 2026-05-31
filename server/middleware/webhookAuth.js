const crypto = require('crypto');

/**
 * verifyWebhookSignature
 * Validates the X-Webhook-Signature header against a HMAC-SHA256 signature
 * computed from the raw request body + WEBHOOK_SECRET env var.
 *
 * The client (only our own server) must sign payloads before sending:
 *   const sig = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET)
 *                     .update(JSON.stringify(payload))
 *                     .digest('hex');
 *   headers: { 'X-Webhook-Signature': `sha256=${sig}` }
 */
function verifyWebhookSignature(req, res, next) {
  const secret = process.env.WEBHOOK_SECRET;

  // If no secret is configured, block all webhook requests in production
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        error: 'Webhook endpoint is not configured on this server.',
      });
    }
    // In development without secret, warn but allow (dev convenience)
    console.warn('[webhook] WEBHOOK_SECRET not set — skipping signature check (dev only)');
    return next();
  }

  const incomingSignature = req.headers['x-webhook-signature'];

  if (!incomingSignature) {
    return res.status(401).json({
      error: 'Missing X-Webhook-Signature header.',
    });
  }

  // Compute expected signature from raw body
  const rawBody = JSON.stringify(req.body);
  const expectedSig =
    'sha256=' +
    crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(incomingSignature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSig, 'utf8');

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return res.status(401).json({
      error: 'Invalid webhook signature.',
    });
  }

  next();
}

module.exports = { verifyWebhookSignature };
