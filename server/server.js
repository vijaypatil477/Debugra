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

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';
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

  logger.warn(
    `[rate-limit] blocked ${event.method} ${event.path} from ${event.ip}`
  );
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

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://debugra.tech',
  'https://www.debugra.tech'
];
const extraOrigins = (
  process.env.CORS_ORIGINS ||
  process.env.CLIENT_URL ||
  ""
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultDevOrigins, ...extraOrigins])];

// ──────────────────────────────────────────────
// Security Headers (all six required headers)
// ──────────────────────────────────────────────
app.use(helmet({
  // 1. Strict-Transport-Security — force HTTPS for 1 year (prod only)
  strictTransportSecurity: isProd
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,

  // 2. Content-Security-Policy — tight API-only policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'none'"],
      scriptSrc:      ["'none'"],
      styleSrc:       ["'none'"],
      imgSrc:         ["'none'"],
      connectSrc:     ["'self'"],
      fontSrc:        ["'none'"],
      objectSrc:      ["'none'"],
      mediaSrc:       ["'none'"],
      frameSrc:       ["'none'"],
      frameAncestors: ["'none'"],
      formAction:     ["'none'"],
      upgradeInsecureRequests: isProd ? [] : null,
    },
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
}));

// 6. Permissions-Policy — helmet doesn't set this natively; add manually
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
  );
  next();
});

// ──────────────────────────────────────────────
// CORS
// ──────────────────────────────────────────────
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Groq-Api-Key'],
  optionsSuccessStatus: 204,
}));

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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/execute', executeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin/memory-profile', memoryRoutes);
app.use('/api/webhooks', webhookRoutes);

// ──────────────────────────────────────────────
// Error Handler
// ──────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 Debugra server running on port ${PORT}`);
  logger.info(`🔒 Security headers: HSTS=${isProd}, CSP=on, Permissions-Policy=on`);
  memoryProfiler.start();
});

