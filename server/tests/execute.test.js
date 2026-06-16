const request = require('supertest');
const express = require('express');
const { executeCode } = require('../services/judge0Service');

// Mock the execution service
jest.mock('../services/judge0Service');

const executeRoutes = require('../routes/execute');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/execute', executeRoutes);
  return app;
}

describe('POST /api/execute — Caching & Payload Limits', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  it('successfully returns execution output and caches the result', async () => {
    const mockOutput = {
      stdout: 'Success!',
      stderr: null,
      compile_output: null,
      status: { id: 3, description: 'Accepted' },
    };

    executeCode.mockResolvedValue(mockOutput);

    const payload = {
      source_code: 'print("hello")',
      language_id: 71,
      stdin: 'hello',
    };

    // First request - should call executeCode
    const res1 = await request(app).post('/api/execute').send(payload);
    expect(res1.status).toBe(200);
    expect(res1.body).toEqual(mockOutput);
    expect(executeCode).toHaveBeenCalledTimes(1);

    // Second request - should hit cache and NOT call executeCode
    const res2 = await request(app).post('/api/execute').send(payload);
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual(mockOutput);
    expect(executeCode).toHaveBeenCalledTimes(1);
  });

  it('rejects requests missing source_code or language_id', async () => {
    const res = await request(app)
      .post('/api/execute')
      .send({ source_code: 'print("hello")' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('source_code and language_id are required');
  });

  it('rejects source code payloads exceeding the 50KB limit', async () => {
    // Generate a payload larger than 50KB (50,001 characters)
    const largeSourceCode = 'a'.repeat(50001);

    const res = await request(app)
      .post('/api/execute')
      .send({ source_code: largeSourceCode, language_id: 71 });

    expect(res.status).toBe(413);
    expect(res.body.error).toContain('Payload Too Large');
    expect(executeCode).not.toHaveBeenCalled();
  });
});
