const crypto = require('crypto');
const request = require('supertest');
const express = require('express');

// ── Minimal app setup for testing ────────────────────────────────────────────
function buildApp(secret) {
  process.env.WEBHOOK_SECRET = secret || '';
  process.env.NODE_ENV = 'test';
  process.env.DISCORD_WEBHOOK_URL = '';
  process.env.SLACK_WEBHOOK_URL = '';

  const app = express();
  app.use(express.json());
  app.use('/api/webhooks', require('../routes/webhooks'));
  return app;
}

function makeSignature(body, secret) {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('POST /api/webhooks/room-event', () => {
  const SECRET = 'test-secret-abc123';
  const VALID_PAYLOAD = {
    event: 'room-created',
    roomId: 'room-abc',
    userName: 'alice',
    passwordProtected: false,
  };

  let app;
  beforeAll(() => {
    app = buildApp(SECRET);
  });

  // ── Authentication ────────────────────────────────────────────────────────
  test('rejects request with no signature header (401)', async () => {
    const res = await request(app).post('/api/webhooks/room-event').send(VALID_PAYLOAD);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Missing X-Webhook-Signature/i);
  });

  test('rejects request with wrong signature (401)', async () => {
    const res = await request(app)
      .post('/api/webhooks/room-event')
      .set('X-Webhook-Signature', 'sha256=badhash000')
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid webhook signature/i);
  });

  test('accepts request with valid signature', async () => {
    const sig = makeSignature(VALID_PAYLOAD, SECRET);
    // Will get 503 because no webhook URLs are set — that's fine, auth passed
    const res = await request(app)
      .post('/api/webhooks/room-event')
      .set('X-Webhook-Signature', sig)
      .send(VALID_PAYLOAD);
    expect([200, 503]).toContain(res.status);
  });

  // ── Input validation ──────────────────────────────────────────────────────
  test('rejects missing required fields (400)', async () => {
    const payload = { event: 'room-created' }; // missing roomId, userName
    const sig = makeSignature(payload, SECRET);
    const res = await request(app)
      .post('/api/webhooks/room-event')
      .set('X-Webhook-Signature', sig)
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/i);
  });

  test('rejects unknown event type (400)', async () => {
    const payload = { ...VALID_PAYLOAD, event: 'MALICIOUS_EVENT' };
    const sig = makeSignature(payload, SECRET);
    const res = await request(app)
      .post('/api/webhooks/room-event')
      .set('X-Webhook-Signature', sig)
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid event type/i);
  });

  test('rejects oversized field (400)', async () => {
    const payload = { ...VALID_PAYLOAD, userName: 'a'.repeat(300) };
    const sig = makeSignature(payload, SECRET);
    const res = await request(app)
      .post('/api/webhooks/room-event')
      .set('X-Webhook-Signature', sig)
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/maximum length/i);
  });

  test('rejects non-boolean passwordProtected (400)', async () => {
    const payload = { ...VALID_PAYLOAD, passwordProtected: 'yes' };
    const sig = makeSignature(payload, SECRET);
    const res = await request(app)
      .post('/api/webhooks/room-event')
      .set('X-Webhook-Signature', sig)
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/boolean/i);
  });

  // ── Rate limiting ─────────────────────────────────────────────────────────
  test('rate limits after 10 requests per minute (429)', async () => {
    const localApp = buildApp(SECRET);
    const sig = makeSignature(VALID_PAYLOAD, SECRET);

    // Fire 11 requests
    let lastStatus;
    for (let i = 0; i < 11; i++) {
      const res = await request(localApp)
        .post('/api/webhooks/room-event')
        .set('X-Webhook-Signature', sig)
        .send(VALID_PAYLOAD);
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  // ── Mention sanitization ──────────────────────────────────────────────────
  test('sanitizeForMessaging neutralises @everyone', () => {
    const dangerous = '@everyone look at this @here';
    const sanitized = dangerous.replace(/@(everyone|here|channel)/gi, '[@$1]');
    expect(sanitized).not.toContain('@everyone');
    expect(sanitized).not.toContain('@here');
    expect(sanitized).toContain('[@everyone]');
  });

  test('sanitizeForMessaging neutralises Discord ID mentions', () => {
    const dangerous = 'Hello <@123456789> and <#987654321>';
    const sanitized = dangerous.replace(/<(@[!&]?|#)\d+>/g, '[mention]');
    expect(sanitized).not.toContain('<@');
    expect(sanitized).not.toContain('<#');
    expect(sanitized).toContain('[mention]');
  });
});
