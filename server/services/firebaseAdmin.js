const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

let db = null;

try {
  const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  db = admin.firestore();
  logger.info('[Firebase Admin] Successfully initialized with service account.');
} catch (error) {
  logger.warn('[Firebase Admin] Initialization failed (this is expected if service account is not provided locally).');
  logger.warn('[Firebase Admin] Auto-clear feature will not work.');
}

module.exports = { admin, db };
