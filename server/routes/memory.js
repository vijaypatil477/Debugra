const express = require('express');
const router = express.Router();
const memoryProfiler = require('../services/memoryProfiler');
const requireAdminToken = require('../middleware/requireAdminToken');

router.use(requireAdminToken);

/**
 * @route   GET /api/admin/memory-profile
 * @desc    Get detailed memory utilization diagnostic report and history.
 */
router.get('/', (req, res, next) => {
  try {
    const report = memoryProfiler.generateDiagnosticReport();
    res.json(report);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/admin/memory-profile/settings
 * @desc    Dynamically configure memory profiler warning parameters.
 */
router.post('/settings', (req, res, next) => {
  try {
    const { sampleIntervalMs, heapLimitPercentage, consecutiveClimbLimit } = req.body;

    if (sampleIntervalMs !== undefined) {
      if (typeof sampleIntervalMs !== 'number' || sampleIntervalMs <= 1000) {
        return res.status(400).json({ error: 'sampleIntervalMs must be a number greater than 1000' });
      }
      memoryProfiler.settings.sampleIntervalMs = sampleIntervalMs;
      // Restart background polling with new interval
      memoryProfiler.start();
    }

    if (heapLimitPercentage !== undefined) {
      if (typeof heapLimitPercentage !== 'number' || heapLimitPercentage <= 0 || heapLimitPercentage > 100) {
        return res.status(400).json({ error: 'heapLimitPercentage must be a number between 1 and 100' });
      }
      memoryProfiler.settings.heapLimitPercentage = heapLimitPercentage;
    }

    if (consecutiveClimbLimit !== undefined) {
      if (typeof consecutiveClimbLimit !== 'number' || consecutiveClimbLimit <= 0) {
        return res.status(400).json({ error: 'consecutiveClimbLimit must be a positive number greater than 0' });
      }
      memoryProfiler.settings.consecutiveClimbLimit = consecutiveClimbLimit;
    }

    res.json({
      message: 'Memory profiler configuration updated successfully.',
      settings: memoryProfiler.settings
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/admin/memory-profile/clear-alerts
 * @desc    Clear memory alerts history and resets climb counters.
 */
router.post('/clear-alerts', (req, res, next) => {
  try {
    memoryProfiler.clearWarnings();
    res.json({ message: 'Memory alert logs cleared and leak monitoring counters reset successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/admin/memory-profile/gc
 * @desc    Exposes manual GC trigger for diagnostic profiling.
 */
router.post('/gc', (req, res, next) => {
  try {
    const result = memoryProfiler.triggerGC();
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
