const memoryProfiler = require('../services/memoryProfiler');

// Configurable settings for memory diagnostic headers
const isDev = process.env.NODE_ENV !== 'production';
const explicitlyEnabled = process.env.ENABLE_MEMORY_DIAGNOSTICS === 'true';
const explicitlyDisabled = process.env.ENABLE_MEMORY_DIAGNOSTICS === 'false';

// If explicitly disabled, sample rate is 0. If explicitly enabled, default sample rate is 1.0 (unless customized).
// If not specified, default to 1.0 in development and 0.0 in production.
const defaultSampleRate = explicitlyDisabled ? 0.0 : explicitlyEnabled ? 1.0 : isDev ? 1.0 : 0.0;
const sampleRate = process.env.MEMORY_SAMPLE_RATE
  ? parseFloat(process.env.MEMORY_SAMPLE_RATE)
  : defaultSampleRate;

/**
 * Express middleware to profile memory usage on specific route entries,
 * track connections, and append standard diagnostic status headers.
 *
 * NOTE: Headers must be set BEFORE they are flushed to the client.
 * We override res.writeHead (called implicitly by res.send/json/end) so
 * our diagnostic headers are injected at the last possible moment —
 * unlike res.on('finish'), which fires after the response is already sent
 * and where setHeader calls are silently discarded.
 */
function memoryTracker(req, res, next) {
  // Track connections if the endpoint suggests collaboration activity
  // For example: creating/joining rooms or initiating collab sessions
  if (
    req.path &&
    (req.path.includes('/room') ||
      req.path.includes('/collaboration') ||
      (req.body && req.body.roomId))
  ) {
    memoryProfiler.recordRoomConnection();
  }

  // Determine if this request should be sampled for memory diagnostics
  const shouldInjectHeaders = sampleRate > 0 && Math.random() < sampleRate;

  if (shouldInjectHeaders) {
    // Override writeHead to inject diagnostic headers just before they are sent.
    // This is the earliest safe point where all route-level headers are already
    // set, but the response has not yet left the server.
    const originalWriteHead = res.writeHead.bind(res);
    res.writeHead = function injectDiagnosticHeaders(statusCode, statusMessageOrHeaders, headers) {
      try {
        const report = memoryProfiler.generateDiagnosticReport();
        res.setHeader('X-Debugra-Memory-Status', report.status);
        res.setHeader('X-Debugra-Heap-Usage-Percent', report.currentMemory.heapUsedPercent);
      } catch (err) {
        // Fail-silent — never let a diagnostic error break a real response
        console.error('[MemoryTracker Middleware Error]:', err.message);
      }
      return originalWriteHead(statusCode, statusMessageOrHeaders, headers);
    };
  }

  next();
}

module.exports = memoryTracker;
