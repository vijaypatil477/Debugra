const request = require('supertest');
const express = require('express');
const { createExecuteLimiter, createAiLimiter } = require('../middleware/rateLimiters');

function buildApp(limiter) {
  const app = express();
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

  it('skips rate limiting when custom x-groq-api-key header is supplied', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/')
        .set('x-groq-api-key', 'gsk_y_thisisaverylongapikeyandvalidlengthmorethan20');
      expect(res.status).toBe(200);
    }
  });

  it('does not skip rate limiting when x-groq-api-key header is too short', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/').set('x-groq-api-key', 'shortkey');
      expect(res.status).toBe(200);
    }
    const res = await request(app).post('/').set('x-groq-api-key', 'shortkey');
    expect(res.status).toBe(429);
  });
});
