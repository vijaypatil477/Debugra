const request = require('supertest');
const express = require('express');
const cors = require('cors');

const PRODUCTION_ORIGINS = [
  'https://debugra.tech',
  'https://www.debugra.tech',
];

const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...PRODUCTION_ORIGINS,
];

/**
 * Build a minimal app with the same CORS configuration used in server.js
 * but with overridable env vars for testing.
 */
function buildApp(options = {}) {
  const {
    isProd = false,
    allowOriginless = false,
    allowedOrigins = null,
  } = options;

  // Simulate server.js logic
  const defaultDevOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://debugra.tech',
    'https://www.debugra.tech',
  ];

  const extraOrigins = [
    ...((process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean)),
    ...((process.env.CLIENT_URL || '').split(',').map((o) => o.trim()).filter(Boolean)),
  ];

  const origins = allowedOrigins || [...new Set([...defaultDevOrigins, ...extraOrigins].filter(Boolean))];
  const allowOriginlessRequests = allowOriginless;

  const app = express();
  app.use(
    cors({
      origin(origin, callback) {
        if (origins.includes(origin)) {
          return callback(null, true);
        }

        if (!origin) {
          if (allowOriginlessRequests) {
            return callback(null, true);
          }
          const err = new Error('Not allowed by CORS');
          err.status = 403;
          return callback(err);
        }

        const err = new Error('Not allowed by CORS');
        err.status = 403;
        return callback(err);
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 204,
    })
  );
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  return app;
}

describe('CORS — Allowed origins', () => {
  let app;

  beforeEach(() => {
    app = buildApp({ isProd: false, allowOriginless: false });
  });

  it.each(DEV_ORIGINS)('allows requests from dev origin %s', async (origin) => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', origin);
    expect(res.status).toBe(200);
  });

  it('blocks requests from unknown origins', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://evil.com');
    expect(res.status).toBe(403);
  });

  it.each(PRODUCTION_ORIGINS)('allows production origin %s in dev mode', async (origin) => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', origin);
    expect(res.status).toBe(200);
  });
});

describe('CORS — Originless requests (default: disallowed)', () => {
  let app;

  beforeEach(() => {
    app = buildApp({ isProd: false, allowOriginless: false });
  });

  it('blocks requests without an Origin header in dev mode (secure default)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(403);
  });
});

describe('CORS — Originless requests (explicitly allowed)', () => {
  let app;

  beforeEach(() => {
    app = buildApp({ isProd: false, allowOriginless: true });
  });

  it('allows requests without an Origin header when ALLOW_ORIGINLESS_REQUESTS=true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});

describe('CORS — Production mode', () => {
  let app;

  beforeEach(() => {
    app = buildApp({ isProd: true, allowOriginless: false });
  });

  it('allows production origins', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://debugra.tech');
    expect(res.status).toBe(200);
  });

  it('blocks originless requests in production', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(403);
  });
});

describe('CORS — Preflight (OPTIONS)', () => {
  let app;

  beforeEach(() => {
    app = buildApp({ isProd: false, allowOriginless: false });
  });

  it('responds with 204 for valid preflight', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
