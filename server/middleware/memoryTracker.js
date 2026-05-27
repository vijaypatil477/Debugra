const memoryProfiler = require('../services/memoryProfiler');

/**
 * Express middleware to profile memory usage on specific route entries,
 * track connections, and append standard diagnostic status headers.
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

  // Hook into response output to attach custom diagnostic headers
  res.on('response', () => {
    try {
      const report = memoryProfiler.generateDiagnosticReport();
      res.setHeader('X-Debugra-Memory-Status', report.status);
      res.setHeader('X-Debugra-Heap-Usage-Percent', report.currentMemory.heapUsedPercent);
    } catch (err) {
      // Fail-silent in production middleware
      console.error('[MemoryTracker Middleware Error]:', err.message);
    }
  });

  next();
}

module.exports = memoryTracker;
