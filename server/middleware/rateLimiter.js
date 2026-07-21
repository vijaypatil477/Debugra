const { rateLimit } = require('express-rate-limit');

function getIpKey(req) {
  return req.ip;
}

function getRoomIdKey(req) {
  const roomId = typeof req.body?.roomId === 'string' ? req.body.roomId.trim() : '';
  return roomId || 'unknown-room';
}

function createRoomPasswordIpLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many attempts. Access blocked for 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getIpKey,
  });
}

function createRoomPasswordRoomLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many attempts for this room. Access blocked for 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRoomIdKey,
  });
}

const roomPasswordIpLimiter = createRoomPasswordIpLimiter();
const roomPasswordRoomLimiter = createRoomPasswordRoomLimiter();
const roomPasswordLimiter = [roomPasswordIpLimiter, roomPasswordRoomLimiter];

module.exports = {
  roomPasswordLimiter,
  roomPasswordIpLimiter,
  roomPasswordRoomLimiter,
  createRoomPasswordIpLimiter,
  createRoomPasswordRoomLimiter,
};
