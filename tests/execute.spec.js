import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001';
const ALLOWED_ORIGIN = 'http://localhost:5173';

test.describe('POST /api/execute - request validation', () => {
  test('rejects missing source_code', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/execute`, {
      headers: { Origin: ALLOWED_ORIGIN },
      data: { language_id: 71 },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('source_code');
  });

  test('rejects missing language_id', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/execute`, {
      headers: { Origin: ALLOWED_ORIGIN },
      data: { source_code: 'print(1)' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('language_id');
  });

  test('rejects oversized source_code with 413', async ({ request }) => {
    const largeSource = 'x'.repeat(100001);
    const res = await request.post(`${API_BASE}/api/execute`, {
      headers: { Origin: ALLOWED_ORIGIN },
      data: { source_code: largeSource, language_id: 71 },
    });
    expect(res.status()).toBe(413);
    const body = await res.json();
    expect(body.error).toContain('source_code exceeds maximum length');
  });

  test('rejects oversized stdin with 413', async ({ request }) => {
    const largeStdin = 'x'.repeat(10001);
    const res = await request.post(`${API_BASE}/api/execute`, {
      headers: { Origin: ALLOWED_ORIGIN },
      data: { source_code: 'print(1)', language_id: 71, stdin: largeStdin },
    });
    expect(res.status()).toBe(413);
    const body = await res.json();
    expect(body.error).toContain('stdin exceeds maximum length');
  });
});
