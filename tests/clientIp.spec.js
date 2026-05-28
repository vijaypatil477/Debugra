import { test, expect } from '@playwright/test';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { isValidIp, getClientIp } = require('../server/server.js');

test.describe('isValidIp', () => {
  test('accepts valid IPv4', () => {
    expect(isValidIp('192.168.1.1')).toBe(true);
    expect(isValidIp('127.0.0.1')).toBe(true);
    expect(isValidIp('8.8.8.8')).toBe(true);
  });

  test('accepts valid IPv6', () => {
    expect(isValidIp('::1')).toBe(true);
    expect(isValidIp('2001:db8::1')).toBe(true);
  });

  test('rejects null, undefined, empty string', () => {
    expect(isValidIp(null)).toBe(false);
    expect(isValidIp(undefined)).toBe(false);
    expect(isValidIp('')).toBe(false);
  });

  test('rejects non-IP strings', () => {
    expect(isValidIp('abc')).toBe(false);
    expect(isValidIp('not-an-ip')).toBe(false);
    expect(isValidIp('999.999.999.999')).toBe(false);
  });
});

test.describe('getClientIp', () => {
  function mockReq(ip, remoteAddress) {
    return { ip, socket: { remoteAddress } };
  }

  test('returns req.ip when valid', () => {
    expect(getClientIp(mockReq('192.168.1.1', '127.0.0.1'))).toBe('192.168.1.1');
  });

  test('falls back to socket.remoteAddress when req.ip is missing', () => {
    expect(getClientIp(mockReq(undefined, '10.0.0.1'))).toBe('10.0.0.1');
  });

  test('returns unknown when both are missing', () => {
    expect(getClientIp(mockReq(undefined, undefined))).toBe('unknown');
  });

  test('returns unknown when both are invalid', () => {
    expect(getClientIp(mockReq('invalid', 'also-invalid'))).toBe('unknown');
  });
});
