const UID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

function getRateLimitKey(req) {
  const uid = String(req.user?.uid || '').trim();
  if (uid && UID_PATTERN.test(uid)) {
    return `user:${uid}`;
  }
  return req.ip;
}

module.exports = { getRateLimitKey, UID_PATTERN };
