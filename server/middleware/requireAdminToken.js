const crypto = require('crypto');

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function extractBearerToken(req) {
  const authHeader = String(req.get('authorization') || '');
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return '';
  }
  return authHeader.slice(7).trim();
}

function requireAdminToken(req, res, next) {
  const configuredToken = String(process.env.DEBUGRA_ADMIN_TOKEN || '').trim();

  if (!configuredToken) {
    return res.status(503).json({
      error: 'Admin diagnostics are unavailable because DEBUGRA_ADMIN_TOKEN is not configured.',
    });
  }

  const requestToken = String(req.get('x-admin-token') || '').trim() || extractBearerToken(req);
  if (!requestToken || !safeCompare(requestToken, configuredToken)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
}

module.exports = requireAdminToken;
