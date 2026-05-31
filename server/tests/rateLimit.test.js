const request = require('supertest');
const express = require('express');
const { createExecuteLimiter, createAiLimiter } = require('../middleware/rateLimiters');
const attachUserIdentity = require('../middleware/attachUserIdentity');

function buildApp(limiter, { userMiddleware = attachUserIdentity } = {}) {
  const app = express();
  app.set('trust proxy', 1);
  if (userMiddleware) {
    app.use(userMiddleware);
  }
  app.use(limiter);
  app.post('/', (req, res) => res.json({ ok: true }));
  return app;
}

describe('executeLimiter — /api/execute', () => {
  let app;
  beforeEach(() => {
    app = buildApp(createExecuteLimiter());
  });

  it('allows the first 10 requests', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/');
      expect(res.status).toBe(200);
    }
  });

  it('blocks the 11th request with 429', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post('/');
    }
    const res = await request(app).post('/');
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/Compilation limit/);
  });

  it('includes Retry-After header on 429', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post('/');
    }
    const res = await request(app).post('/');
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('shares limit across IPs for the same X-User-Id', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/')
        .set('X-User-Id', 'user-alpha')
        .set('X-Forwarded-For', `10.0.0.${i + 1}`);
      expect(res.status).toBe(200);
    }

    const res = await request(app)
      .post('/')
      .set('X-User-Id', 'user-alpha')
      .set('X-Forwarded-For', '10.0.0.99');
    expect(res.status).toBe(429);
  });

  it('tracks different X-User-Id values independently on the same IP', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/')
        .set('X-User-Id', 'user-beta')
        .set('X-Forwarded-For', '192.168.1.1');
      expect(res.status).toBe(200);
    }

    const blocked = await request(app)
      .post('/')
      .set('X-User-Id', 'user-beta')
      .set('X-Forwarded-For', '192.168.1.1');
    expect(blocked.status).toBe(429);

    const otherUser = await request(app)
      .post('/')
      .set('X-User-Id', 'user-gamma')
      .set('X-Forwarded-For', '192.168.1.1');
    expect(otherUser.status).toBe(200);
  });

  it('falls back to IP when X-User-Id is invalid', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/')
        .set('X-User-Id', 'bad uid with spaces')
        .set('X-Forwarded-For', '203.0.113.10');
      expect(res.status).toBe(200);
    }

    const res = await request(app)
      .post('/')
      .set('X-User-Id', 'bad uid with spaces')
      .set('X-Forwarded-For', '203.0.113.10');
    expect(res.status).toBe(429);
  });
});

describe('aiLimiter — /api/ai', () => {
  let app;
  beforeEach(() => {
    app = buildApp(createAiLimiter());
  });

  it('allows the first 5 requests', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/');
      expect(res.status).toBe(200);
    }
  });

  it('blocks the 6th request with 429', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/');
    }
    const res = await request(app).post('/');
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/AI request limit/);
  });

  it('includes Retry-After header on 429', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/');
    }
    const res = await request(app).post('/');
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('shares limit across IPs for the same X-User-Id', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/')
        .set('X-User-Id', 'ai-user-one')
        .set('X-Forwarded-For', `172.16.0.${i + 1}`);
      expect(res.status).toBe(200);
    }

    const res = await request(app)
      .post('/')
      .set('X-User-Id', 'ai-user-one')
      .set('X-Forwarded-For', '172.16.0.99');
    expect(res.status).toBe(429);
  });
});
