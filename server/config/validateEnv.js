/**
 * validateEnv.js
 * Runs at server startup. Fails fast if required env vars are missing or invalid.
 */

const REQUIRED_VARS = [
  { key: 'GROQ_API_KEY',         type: 'string' },
  { key: 'CLIENT_URL',           type: 'url'    },
  { key: 'CORS_ORIGINS',         type: 'string' },
  { key: 'DEBUGRA_ADMIN_TOKEN',  type: 'string' },
];

const OPTIONAL_VARS = [
  { key: 'PORT',                 type: 'port',   default: '3001' },
  { key: 'CSP_REPORT_URI',       type: 'string', default: '/api/security/csp-report' },
];

function validateEnv() {
  const errors = [];

  // ── Check required vars ──────────────────────────────────────────────────
  for (const { key, type } of REQUIRED_VARS) {
    const value = process.env[key];

    if (!value || value.trim() === '') {
      errors.push(`Missing required env var: ${key}`);
      continue;
    }

    if (type === 'url') {
      try {
        new URL(value);
      } catch {
        errors.push(`${key} is not a valid URL: "${value}"`);
      }
    }

    if (type === 'port') {
      const port = Number(value);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        errors.push(`${key} must be a valid port number (1-65535): "${value}"`);
      }
    }
  }

  // ── Warn about optional vars using defaults ──────────────────────────────
  for (const { key, default: def } of OPTIONAL_VARS) {
    if (!process.env[key]) {
      console.warn(`${key} not set — using default: ${def}`);
    }
  }

  // ── Fail fast if any required var is missing/invalid ────────────────────
  if (errors.length > 0) {
    console.error('\nServer startup failed — invalid environment:\n');
    errors.forEach((e) => console.error('  ' + e));
    console.error('\nCopy server/.env.example to server/.env and fill in all values.\n');
    process.exit(1);
  }

  console.log('Environment validation passed.');
}

module.exports = { validateEnv };