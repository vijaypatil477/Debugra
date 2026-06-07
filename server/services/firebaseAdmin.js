const admin = require('firebase-admin');
const logger = require('../utils/logger');

/**
 * Shared Firebase Admin SDK initialization.
 *
 * Provides a trusted, server-side Firestore handle that bypasses Firestore
 * security rules — needed for operations no single client is allowed to perform,
 * such as the stale-room cleanup job (rules only let a room's own creator delete
 * it, see firestore.rules).
 *
 * Credential resolution order:
 *   1. FIREBASE_SERVICE_ACCOUNT_BASE64 — base64-encoded service-account JSON.
 *      Preferred on hosts where you can't drop a credentials file (Render/Railway).
 *   2. GOOGLE_APPLICATION_CREDENTIALS — application default credentials (file path,
 *      or the metadata server when running on Google Cloud).
 *   3. FIRESTORE_EMULATOR_HOST — local emulator; no real credentials required.
 *
 * If none are present, `isConfigured` is false and `db` is null. Callers MUST
 * no-op in that case rather than crash, so the rest of the API (/execute, /ai)
 * keeps working without Firebase credentials.
 */

let db = null;
let isConfigured = false;

function loadServiceAccount() {
  const base64 = (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '').trim();
  if (!base64) return null;
  try {
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  } catch (err) {
    logger.error('[firebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64: ' + err.message);
    return null;
  }
}

function init() {
  // Reuse an app initialized elsewhere (e.g. routes/rooms.js) if present.
  if (admin.apps.length) {
    db = admin.firestore();
    isConfigured = true;
    return;
  }

  const usingEmulator = Boolean((process.env.FIRESTORE_EMULATOR_HOST || '').trim());
  const hasAdc = Boolean((process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim());
  const serviceAccount = loadServiceAccount();

  if (!serviceAccount && !usingEmulator && !hasAdc) {
    logger.warn(
      '[firebaseAdmin] No credentials found — server-side Firestore features disabled. ' +
        'Set FIREBASE_SERVICE_ACCOUNT_BASE64, GOOGLE_APPLICATION_CREDENTIALS, or FIRESTORE_EMULATOR_HOST to enable.'
    );
    return;
  }

  try {
    if (serviceAccount) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else if (usingEmulator) {
      // The emulator needs an app + projectId but no real credentials.
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project' });
    } else {
      admin.initializeApp(); // application default credentials
    }
    db = admin.firestore();
    isConfigured = true;
    const mode = serviceAccount ? 'service account' : usingEmulator ? 'emulator' : 'application default credentials';
    logger.info(`[firebaseAdmin] Initialized (${mode}).`);
  } catch (err) {
    isConfigured = false;
    db = null;
    logger.error('[firebaseAdmin] Initialization failed: ' + err.message);
  }
}

init();

module.exports = { admin, db, isConfigured };
