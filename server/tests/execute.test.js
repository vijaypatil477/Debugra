const request = require('supertest');
const express = require('express');
const executeRouter = require('../routes/execute');

// Create a mock express app
const app = express();
app.use(express.json());
app.use('/api/execute', executeRouter);

describe('POST /api/execute - Language ID Validation', () => {
  it('should return 400 if source_code or language_id is missing', async () => {
    const res = await request(app)
      .post('/api/execute')
      .send({ source_code: 'print("hello")' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('source_code and language_id are required');
  });

  it('should return 400 if language_id is invalid (not a number)', async () => {
    const res = await request(app)
      .post('/api/execute')
      .send({ source_code: 'print("hello")', language_id: 'python' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid or unsupported language_id');
  });

  it('should return 400 if language_id is unsupported', async () => {
    const res = await request(app)
      .post('/api/execute')
      .send({ source_code: 'print("hello")', language_id: 999 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid or unsupported language_id');
  });
});
