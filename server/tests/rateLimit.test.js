const request = require('supertest');
const express = require('express');
const { createExecuteLimiter, createAiLimiter } = require('../middleware/rateLimiters');
const { createRoomPasswordRoomLimiter } = require('../middleware/rateLimiter');

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

describe('roomPasswordRoomLimiter - /api/rooms/verify-password', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    app.post('/api/rooms/verify-password', createRoomPasswordRoomLimiter(), (req, res) => {
      res.status(401).json({ error: 'Invalid room or password.' });
    });
  });

  it('blocks attempts for the same room even when X-Forwarded-For changes', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/rooms/verify-password')
        .set('X-Forwarded-For', `203.0.113.${i + 1}`)
        .send({ roomId: 'target-room', password: 'wrong-password' });

      expect(res.status).toBe(401);
    }

    const res = await request(app)
      .post('/api/rooms/verify-password')
      .set('X-Forwarded-For', '203.0.113.99')
      .send({ roomId: 'target-room', password: 'wrong-password' });

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/Too many attempts for this room/);
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
});
