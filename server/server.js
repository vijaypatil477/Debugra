const logger = require('./utils/logger');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');
const executeRoutes = require('./routes/execute');
const aiRoutes = require('./routes/ai');
const memoryRoutes = require('./routes/memory');
const memoryTracker = require('./middleware/memoryTracker');
const memoryProfiler = require('./services/memoryProfiler');
const errorHandler = require('./middleware/errorHandler');
const webhookRoutes = require('./routes/webhooks');
const { executeLimiter, aiLimiter } = require('./middleware/rateLimiters');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';
const cspReportUri = (process.env.CSP_REPORT_URI || '').trim();
const rateLimitEventBufferSize = Number.parseInt(
  process.env.RATE_LIMIT_EVENT_BUFFER_SIZE || '100',
  10
);
const securityDiagnosticsToken = (process.env.SECURITY_DIAGNOSTICS_TOKEN || '').trim();
const rateLimitEvents = [];

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function recordRateLimitEvent(req) {
  const event = {
    timestamp: new Date().toISOString(),
    ip: getClientIp(req),
    method: req.method,
    path: req.originalUrl || req.url,
    userAgent: req.get('user-agent') || 'unknown',
    limit: req.rateLimit?.limit ?? null,
    remaining: req.rateLimit?.remaining ?? null,
    resetTime: req.rateLimit?.resetTime?.toISOString?.() || null,
  };

  rateLimitEvents.unshift(event);
  if (rateLimitEvents.length > rateLimitEventBufferSize) {
    rateLimitEvents.length = rateLimitEventBufferSize;
  }

  logger.warn(`[rate-limit] blocked ${event.method} ${event.path} from ${event.ip}`);
  return event;
}

function getBearerToken(req) {
  const authHeader = req.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');
  return scheme?.toLowerCase() === 'bearer' ? token : '';
}

function requireSecurityDiagnosticsAccess(req, res, next) {
  if (!securityDiagnosticsToken && isProd) {
    return res.status(404).json({ error: 'Security diagnostics are disabled.' });
  }

  if (!securityDiagnosticsToken) {
    return next();
  }

  const providedToken =
    (req.get('x-security-diagnostics-token') || '').trim() || getBearerToken(req);

  if (providedToken !== securityDiagnosticsToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
}

// ──────────────────────────────────────────────
// CORS Origin Configuration
// ──────────────────────────────────────────────

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://debugra.tech',
  'https://www.debugra.tech',
];

// FIX 1: Move unique() above its first usage to avoid
// calling it before it is defined
function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

// FIX 2: Parse CORS_ORIGINS and CLIENT_URL independently
// and merge both — not OR — so neither is silently dropped
const extraOrigins = unique([
  ...(process.env.CORS_ORIGINS || '').split(','),
  ...(process.env.CLIENT_URL   || '').split(','),
].map((o) => o.trim()));

// FIX 3: Merge defaults + extras so production domains
// are always present regardless of env var configuration
const allowedOrigins = unique([...defaultDevOrigins, ...extraOrigins]);

// FIX 4: Log on startup so you can verify in any environment
logger.info('[CORS] Allowed origins: ' + allowedOrigins.join(', '));

function buildCspDirectives() {
  const clientOrigins = unique([...allowedOrigins]);

  const directives = {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    scriptSrc: unique([
      "'self'",
      'https://www.gstatic.com',
      'https://www.googleapis.com',
      'https://cdn.jsdelivr.net',
      'https://cdnjs.cloudflare.com',
    ]),
    styleSrc: unique(["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']),
    imgSrc: ["'self'", 'data:', 'blob:', 'https://*.googleusercontent.com'],
    connectSrc: unique([
      "'self'",
      ...clientOrigins,
      'https://api.groq.com',
      'https://*.firebaseio.com',
      'https://*.googleapis.com',
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://firestore.googleapis.com',
      'https://wandbox.org',
    ]),
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"],
    formAction: ["'self'"],
  };

  if (isProd) {
    directives.upgradeInsecureRequests = [];
  }

  if (cspReportUri) {
    directives.reportUri = [cspReportUri];
  }

  return directives;
}

// ──────────────────────────────────────────────
// Security Headers (all six required headers)
// ──────────────────────────────────────────────
app.use(
  helmet({
    // 1. Strict-Transport-Security — force HTTPS for 1 year (prod only)
    strictTransportSecurity: isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,

    // 2. Content-Security-Policy — strict allowlist for the app's known providers
    contentSecurityPolicy: {
      directives: buildCspDirectives(),
    },

    // 3. X-Frame-Options — prevent clickjacking
    frameguard: { action: 'deny' },

    // 4. X-Content-Type-Options — prevent MIME sniffing
    noSniff: true,

    // 5. Referrer-Policy — no referrer leakage from API
    referrerPolicy: { policy: 'no-referrer' },

    // Other useful helmet defaults kept on
    xssFilter: true,
    hidePoweredBy: true,
    ieNoOpen: true,
  })
);

// 6. Permissions-Policy — helmet doesn't set this natively; add manually
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(self), microphone=(self), display-capture=(self), geolocation=(), payment=(), usb=(), interest-cohort=()'
  );
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post(
  '/api/security/csp-report',
  express.json({
    type: ['application/csp-report', 'application/reports+json', 'application/json'],
  }),
  (req, res) => {
    const report = req.body?.['csp-report'] || req.body;
    console.warn('[csp-report]', {
      blockedUri: report?.['blocked-uri'] || report?.blockedURL,
      violatedDirective: report?.['violated-directive'] || report?.effectiveDirective,
      documentUri: report?.['document-uri'] || report?.documentURL,
    });
    res.status(204).end();
  }
);

// ──────────────────────────────────────────────
// CORS
// ──────────────────────────────────────────────
app.use(
  cors({
    origin(origin, callback) {
      // Reject missing Origin headers consistently to avoid loosening CORS
      // protections in development mode.
      if (!origin) {
        logger.warn('[CORS] Rejected request without Origin header');
        const corsError = new Error('Not allowed by CORS');
        corsError.status = 403;
        return callback(corsError);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn(`[CORS] Blocked origin: ${origin}`);
      const corsError = new Error('Not allowed by CORS');
      corsError.status = 403;
      return callback(corsError);
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Groq-Api-Key', 'x-admin-token', 'x-security-diagnostics-token'],
    optionsSuccessStatus: 204,
  })
);

// ──────────────────────────────────────────────
// Cookie Security
// ──────────────────────────────────────────────
// Wrap res.cookie so every cookie this API emits carries secure flags,
// regardless of where in the middleware chain it is set.
app.use((req, res, next) => {
  const originalCookie = res.cookie.bind(res);
  res.cookie = (name, value, options = {}) =>
    originalCookie(name, value, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      ...options,
    });
  next();
});

// ──────────────────────────────────────────────
// Rate Limiting
// ──────────────────────────────────────────────
app.get('/api/security/rate-limit-events', requireSecurityDiagnosticsAccess, (req, res) => {
  res.json({
    total: rateLimitEvents.length,
    maxSize: rateLimitEventBufferSize,
    events: rateLimitEvents,
  });
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    const event = recordRateLimitEvent(req);
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      event: {
        timestamp: event.timestamp,
        path: event.path,
        resetTime: event.resetTime,
      },
    });
  },
});
app.use('/api', globalLimiter);

// ──────────────────────────────────────────────
// Body Parsing & Compression
// ──────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(memoryTracker);

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────
app.use('/api/execute', executeLimiter, executeRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/admin/memory-profile', memoryRoutes);
app.use('/api/webhooks', webhookRoutes);

// ──────────────────────────────────────────────
// Error Handler
// ──────────────────────────────────────────────
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`🚀 Debugra server running on port ${PORT}`);
    logger.info(`🔒 Security headers: HSTS=${isProd}, CSP=on, Permissions-Policy=on`);
    memoryProfiler.start();
  });
}

module.exports = { app, buildCspDirectives };
