const request = require('supertest');
const { app } = require('../server');

describe('CORS middleware', () => {
  it('allows preflight requests from an allowed development origin', async () => {
    const response = await request(app)
      .options('/api/execute')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rejects requests without an Origin header', async () => {
    const response = await request(app).options('/api/execute');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Not allowed by CORS' });
  });

  it('rejects requests from disallowed origins', async () => {
    const response = await request(app)
      .options('/api/execute')
      .set('Origin', 'https://evil.com');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Not allowed by CORS' });
  });
});
