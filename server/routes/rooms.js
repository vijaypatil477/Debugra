const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin'); // already initialised in server/index.js
const { roomPasswordLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

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
 *
 * Body: { roomId: string, password: string }
 * Response (200): { accessToken: string, expiresAt: number }
 */
router.post('/verify-password', roomPasswordLimiter, async (req, res) => {
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
    const expectedSig = crypto
      .createHmac('sha256', ROOM_TOKEN_SECRET)
      .update(payload)
      .digest('hex');

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
// Test helper: clear in-memory attempt log to improve test isolation
router.clearAttemptLog = () => {
  attemptLog.clear();
};
