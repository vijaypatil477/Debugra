const request = require('supertest');
const express = require('express');

function buildApp() {
  process.env.NODE_ENV = 'test';
  process.env.FEEDBACK_WEBHOOK_URL = '';

  const app = express();
  app.use(express.json());
  app.use('/api/feedback', require('../routes/feedback'));
  return app;
}

describe('POST /api/feedback', () => {
  const app = buildApp();

  test('rejects short messages', async () => {
    const res = await request(app).post('/api/feedback').send({
      name: 'Diya',
      email: 'diya@example.com',
      category: 'suggestion',
      message: 'too short',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 10 characters/i);
  });

  test('accepts valid submissions', async () => {
    const res = await request(app).post('/api/feedback').send({
      name: 'Diya',
      email: 'diya@example.com',
      category: 'bug',
      rating: 5,
      message: 'The editor feels smooth, but the feedback path is missing.',
      source: 'Landing footer',
      pageUrl: 'https://debugra.tech/',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.submittedAt).toBeDefined();
  });
});
