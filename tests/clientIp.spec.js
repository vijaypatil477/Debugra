const { isValidIp, getClientIp } = require('../server/server');

describe('isValidIp', () => {
  it('accepts valid IPv4 addresses', () => {
    expect(isValidIp('192.168.1.1')).toBe(true);
    expect(isValidIp('0.0.0.0')).toBe(true);
    expect(isValidIp('255.255.255.255')).toBe(true);
    expect(isValidIp('127.0.0.1')).toBe(true);
  });

  it('accepts valid IPv6 addresses', () => {
    expect(isValidIp('::1')).toBe(true);
    expect(isValidIp('2001:db8::ff00:42:8329')).toBe(true);
    expect(isValidIp('fe80::1')).toBe(true);
  });

  it('rejects null, undefined, and empty strings', () => {
    expect(isValidIp(null)).toBe(false);
    expect(isValidIp(undefined)).toBe(false);
    expect(isValidIp('')).toBe(false);
  });

  it('rejects invalid IP strings', () => {
    expect(isValidIp('not-an-ip')).toBe(false);
    expect(isValidIp('300.300.300.300')).toBe(false);
    expect(isValidIp('abc.def.ghi.jkl')).toBe(false);
  });

  it('rejects non-string types', () => {
    expect(isValidIp(12345)).toBe(false);
    expect(isValidIp([])).toBe(false);
    expect(isValidIp({})).toBe(false);
  });
});

describe('getClientIp', () => {
  const mockReq = (overrides = {}) => ({
    ip: '192.168.1.1',
    socket: { remoteAddress: '10.0.0.1' },
    headers: {},
    ...overrides,
  });

  it('returns req.ip when valid', () => {
    const req = mockReq({ ip: '203.0.113.5' });
    expect(getClientIp(req)).toBe('203.0.113.5');
  });

  it('falls back to socket.remoteAddress when req.ip is missing', () => {
    const req = mockReq({ ip: undefined });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('returns unknown when both req.ip and socket are missing', () => {
    const req = mockReq({ ip: undefined, socket: undefined });
    expect(getClientIp(req)).toBe('unknown');
  });

  it('returns unknown for invalid IP values', () => {
    const req = mockReq({ ip: 'clearly-invalid' });
    expect(getClientIp(req)).toBe('unknown');
  });

  it('handles IPv6 loopback from req.ip', () => {
    const req = mockReq({ ip: '::1' });
    expect(getClientIp(req)).toBe('::1');
  });
});