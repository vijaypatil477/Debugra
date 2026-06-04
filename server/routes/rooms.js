const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin'); // already initialised in server/index.js
const router = express.Router();

// ── In-memory rate limiter for password attempts ─────────────────────────────
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // max 5 wrong passwords per window per IP+room

const attemptLog = new Map(); // key: `${ip}:${roomId}` -> [timestamp,...]

function passwordRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const roomId = req.body.roomId || 'unknown';
  const key = `${ip}:${roomId}`;
  const now = Date.now();

  const timestamps = (attemptLog.get(key) || []).filter((t) => now - t < ATTEMPT_WINDOW_MS);

  if (timestamps.length >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((ATTEMPT_WINDOW_MS - (now - timestamps[0])) / 1000);
    res.set('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      error: `Too many failed attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`,
    });
  }

  // Attach helper to record a failed attempt
  req._recordFailedAttempt = () => {
    timestamps.push(Date.now());
    attemptLog.set(key, timestamps);
  };

  // Cleanup stale keys occasionally
  if (Math.random() < 0.01) {
    for (const [k, ts] of attemptLog.entries()) {
      if (ts.every((t) => Date.now() - t >= ATTEMPT_WINDOW_MS)) {
        attemptLog.delete(k);
      }
    }
  }

  next();
}

// ── Slow hash comparison using scrypt ────────────────────────────────────────
/**
 * verifyPassword
 * Computes scrypt(password, salt) and compares to the stored hash
 * using timingSafeEqual. scrypt is deliberately slow (N=16384) making
 * offline brute-force attacks computationally expensive.
 */
async function verifyPassword(plainPassword, storedSalt, storedHash) {
  return new Promise((resolve, reject) => {
    // scrypt params: N=16384, r=8, p=1 — OWASP minimum for interactive use
    crypto.scrypt(
      plainPassword,
      storedSalt,
      64, // key length bytes
      { N: 16384, r: 8, p: 1 },
      (err, derivedKey) => {
        if (err) return reject(err);
        try {
          const storedBuf = Buffer.from(storedHash, 'hex');
          const derivedBuf = derivedKey;
          if (storedBuf.length !== derivedBuf.length) return resolve(false);
          resolve(crypto.timingSafeEqual(storedBuf, derivedBuf));
        } catch {
          resolve(false);
        }
      }
    );
  });
}

// ── POST /api/rooms/verify-password ─────────────────────────────────────────
/**
 * Verifies a room password server-side.
 * On success: returns a short-lived signed access token (JWT-like HMAC token).
 * On failure: records the attempt for rate limiting.
 *
 * Body: { roomId: string, password: string }
 * Response (200): { accessToken: string, expiresAt: number }
 */
router.post('/verify-password', passwordRateLimiter, async (req, res) => {
  const { roomId, password } = req.body;

  // ── Basic validation ─────────────────────────────────────────────────────
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    return res.status(400).json({ error: 'roomId is required.' });
  }
  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({ error: 'password is required.' });
  }
  if (password.length > 128) {
    return res.status(400).json({ error: 'password exceeds maximum length.' });
  }

  try {
    // ── Fetch room from Firestore (server-side — bypasses security rules) ──
    const db = admin.firestore();
    const roomSnap = await db.collection('rooms').doc(roomId.trim()).get();

    if (!roomSnap.exists) {
      // Deliberate: same response as wrong password to prevent room enumeration
      req._recordFailedAttempt?.();
      return res.status(401).json({ error: 'Invalid room or password.' });
    }

    const roomData = roomSnap.data();

    // ── Confirm room is password protected ───────────────────────────────
    if (!roomData.passwordProtected && !roomData.isPrivate) {
      return res.status(400).json({ error: 'This room does not require a password.' });
    }

    // ── Retrieve server-only hash fields ────────────────────────────────
    const { passwordHash, passwordSalt } = roomData;

    if (!passwordHash || !passwordSalt) {
      console.error(`[rooms] Room ${roomId} is passwordProtected but missing hash/salt`);
      return res.status(500).json({ error: 'Room configuration error.' });
    }

    // ── Verify using scrypt (slow hash) ─────────────────────────────────
    const isValid = await verifyPassword(password, passwordSalt, passwordHash);

    if (!isValid) {
      req._recordFailedAttempt?.();
      return res.status(401).json({ error: 'Invalid room or password.' });
    }

    // ── Issue short-lived access token (HMAC-SHA256, 30 min TTL) ────────
    const ROOM_TOKEN_SECRET = process.env.ROOM_TOKEN_SECRET;
    if (!ROOM_TOKEN_SECRET) {
      console.error('[rooms] ROOM_TOKEN_SECRET is not set');
      return res.status(503).json({ error: 'Server configuration error.' });
    }

    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes from now
    const payload = `${roomId}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', ROOM_TOKEN_SECRET).update(payload).digest('hex');

    const accessToken = `${Buffer.from(payload).toString('base64')}.${signature}`;

    return res.status(200).json({ accessToken, expiresAt });
  } catch (err) {
    console.error('[rooms] verify-password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/rooms/validate-token ──────────────────────────────────────────
/**
 * Validates a room access token issued by verify-password.
 * Called by the client before allowing entry to a password-protected room.
 *
 * Body: { roomId: string, accessToken: string }
 * Response (200): { valid: true }
 */
router.post('/validate-token', async (req, res) => {
  const { roomId, accessToken } = req.body;

  if (!roomId || !accessToken) {
    return res.status(400).json({ error: 'roomId and accessToken are required.' });
  }

  try {
    const ROOM_TOKEN_SECRET = process.env.ROOM_TOKEN_SECRET;
    if (!ROOM_TOKEN_SECRET) {
      return res.status(503).json({ error: 'Server configuration error.' });
    }

    // Decode and split token
    const lastDot = accessToken.lastIndexOf('.');
    if (lastDot === -1) return res.status(401).json({ error: 'Invalid token format.' });

    const encodedPayload = accessToken.slice(0, lastDot);
    const receivedSig = accessToken.slice(lastDot + 1);

    // Verify signature
    const payload = Buffer.from(encodedPayload, 'base64').toString('utf8');
    const expectedSig = crypto.createHmac('sha256', ROOM_TOKEN_SECRET).update(payload).digest('hex');

    const sigA = Buffer.from(receivedSig, 'utf8');
    const sigB = Buffer.from(expectedSig, 'utf8');

    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    // Verify payload structure and room match
    const [tokenRoomId, expiresAtStr] = payload.split(':');
    if (tokenRoomId !== roomId) {
      return res.status(401).json({ error: 'Token is not valid for this room.' });
    }

    // Check expiry
    if (Date.now() > parseInt(expiresAtStr, 10)) {
      return res.status(401).json({ error: 'Token has expired. Please re-enter the password.' });
    }

    return res.status(200).json({ valid: true });
  } catch (err) {
    console.error('[rooms] validate-token error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
