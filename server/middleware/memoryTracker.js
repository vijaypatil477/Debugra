const memoryProfiler = require('../services/memoryProfiler');

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
    req.path.includes('/room') ||
    req.path.includes('/collaboration') ||
    (req.body && req.body.roomId)
  ) {
    memoryProfiler.recordRoomConnection();
  }

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

  next();
}

module.exports = memoryTracker;
