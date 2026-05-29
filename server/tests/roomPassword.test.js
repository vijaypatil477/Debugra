const crypto = require('crypto');
const request = require('supertest');
const express = require('express');

// ── Mock Firebase Admin SDK ─────────────────────────────────────────────────
const rooms = {
  'room-public': {
    passwordProtected: false,
  },
  'room-private-valid': {
    passwordProtected: true,
    passwordSalt: 'testsalt',
    passwordHash: null,
  },
};

jest.mock('firebase-admin', () => ({
  firestore: () => ({
    collection: () => ({
      doc: (id) => ({
        get: async () => ({
          exists: id in rooms,
          data: () => rooms[id] || {},
        }),
      }),
    }),
  }),
}));

// ── Pre-compute the test hash ────────────────────────────────────────────────
const TEST_PASSWORD = 'correct-password';
const TEST_SALT = 'testsalt';
let TEST_HASH;

beforeAll((done) => {
  crypto.scrypt(TEST_PASSWORD, TEST_SALT, 64, { N: 16384, r: 8, p: 1 }, (err, key) => {
    if (err) return done(err);
    TEST_HASH = key.toString('hex');
    rooms['room-private-valid'].passwordHash = TEST_HASH;
    done();
  });
});

// ── App setup ────────────────────────────────────────────────────────────────
function buildApp() {
  process.env.ROOM_TOKEN_SECRET = 'test-room-secret-xyz';
  process.env.NODE_ENV = 'test';

  const app = express();
  app.use(express.json());
  app.use('/api/rooms', require('../routes/rooms'));
  return app;
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('POST /api/rooms/verify-password', () => {
  let app;
  beforeAll(() => {
    app = buildApp();
  });

  test('rejects missing roomId (400)', async () => {
    const res = await request(app).post('/api/rooms/verify-password').send({ password: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/roomId is required/i);
  });

  test('rejects missing password (400)', async () => {
    const res = await request(app).post('/api/rooms/verify-password').send({ roomId: 'room-private-valid' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password is required/i);
  });

  test('returns 401 for non-existent room (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/rooms/verify-password')
      .send({ roomId: 'does-not-exist', password: 'anything' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid room or password.');
  });

  test('returns 400 for non-password-protected room', async () => {
    const res = await request(app)
      .post('/api/rooms/verify-password')
      .send({ roomId: 'room-public', password: 'anypassword' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/does not require a password/i);
  });

  test('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/rooms/verify-password')
      .send({ roomId: 'room-private-valid', password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid room or password.');
  });

  test('returns 200 + accessToken for correct password', async () => {
    const res = await request(app)
      .post('/api/rooms/verify-password')
      .send({ roomId: 'room-private-valid', password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.expiresAt).toBeGreaterThan(Date.now());
  });

  test('rate limits after 5 failed attempts (429)', async () => {
    const freshApp = buildApp();
    let lastStatus;
    for (let i = 0; i < 6; i++) {
      const res = await request(freshApp)
        .post('/api/rooms/verify-password')
        .send({ roomId: 'room-private-valid', password: 'wrong' });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});

describe('POST /api/rooms/validate-token', () => {
  let app;
  let validToken;

  beforeAll(async () => {
    app = buildApp();
    const res = await request(app)
      .post('/api/rooms/verify-password')
      .send({ roomId: 'room-private-valid', password: TEST_PASSWORD });
    validToken = res.body.accessToken;
  });

  test('validates a correct token (200)', async () => {
    const res = await request(app)
      .post('/api/rooms/validate-token')
      .send({ roomId: 'room-private-valid', accessToken: validToken });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  test('rejects a tampered token (401)', async () => {
    const res = await request(app)
      .post('/api/rooms/validate-token')
      .send({ roomId: 'room-private-valid', accessToken: validToken + 'tampered' });
    expect(res.status).toBe(401);
  });

  test('rejects token for wrong room (401)', async () => {
    const res = await request(app)
      .post('/api/rooms/validate-token')
      .send({ roomId: 'room-public', accessToken: validToken });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/not valid for this room/i);
  });

  test('rejects missing fields (400)', async () => {
    const res = await request(app)
      .post('/api/rooms/validate-token')
      .send({ roomId: 'room-private-valid' });
    expect(res.status).toBe(400);
  });
});
