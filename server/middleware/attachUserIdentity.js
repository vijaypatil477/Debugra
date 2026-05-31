const { UID_PATTERN } = require('./rateLimitKey');

function attachUserIdentity(req, _res, next) {
  const uid = String(req.get('x-user-id') || '').trim();
  if (uid && UID_PATTERN.test(uid)) {
    req.user = { uid };
  }
  next();
}

module.exports = attachUserIdentity;
