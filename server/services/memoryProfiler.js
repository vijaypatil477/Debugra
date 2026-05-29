const v8 = require('v8');

class MemoryProfilerService {
  constructor() {
    this.snapshots = [];
    this.warnings = [];
    this.connectionCount = 0;
    this.intervalId = null;

    // Configurable Settings
    this.settings = {
      sampleIntervalMs: 15000,          // 15 seconds default
      heapLimitPercentage: 80,          // Alert if heapUsed > 80% of V8 limit
      consecutiveClimbLimit: 5,         // Alert if heapUsed increases 5 times in a row
      maxSnapshots: 100,                // History retention limit
      maxWarnings: 50                   // Warning stamp retention limit
    };

    // Keep track of how many consecutive times the memory has climbed
    this.climbCounter = 0;
  }

  /**
   * Helper to format bytes to Megabytes (MB) with precision.
   */
  toMB(bytes) {
    return Math.round((bytes / 1024 / 1024) * 100) / 100;
  }

  /**
   * Start the background memory monitoring loop.
   */
  start() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Take immediate initial snapshot
    this.takeSnapshot();

    this.intervalId = setInterval(() => {
      this.takeSnapshot();
    }, this.settings.sampleIntervalMs);

    console.log(`[MemoryProfiler] Monitoring initialized with ${this.settings.sampleIntervalMs}ms intervals.`);
  }

  /**
   * Stop the monitoring loop.
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`[MemoryProfiler] Monitoring loop stopped.`);
    }
  }

  /**
   * Record a room connection event and check memory immediately.
   */
  recordRoomConnection() {
    this.connectionCount++;
    console.log(`[MemoryProfiler] Room connection recorded. Total connections: ${this.connectionCount}`);
    this.takeSnapshot("room_connection");
  }

  /**
   * Captures memory statistics and processes alarms/leaks.
   */
  takeSnapshot(trigger = "interval") {
    const memory = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    const heapLimit = heapStats.heap_size_limit;

    const currentSnapshot = {
      timestamp: new Date().toISOString(),
      trigger,
      rss: this.toMB(memory.rss),
      heapTotal: this.toMB(memory.heapTotal),
      heapUsed: this.toMB(memory.heapUsed),
      external: this.toMB(memory.external),
      arrayBuffers: this.toMB(memory.arrayBuffers || 0),
      heapLimit: this.toMB(heapLimit),
      heapUsedPercent: Math.round((memory.heapUsed / heapLimit) * 10000) / 100
    };

    // Insert snapshot and limit history
    this.snapshots.push(currentSnapshot);
    if (this.snapshots.length > this.settings.maxSnapshots) {
      this.snapshots.shift();
    }

    // Process leak/anomaly detection
    this.analyzeLeakPotential(currentSnapshot);

    return currentSnapshot;
  }

  /**
   * Analyze snapshots for thresholds and leak trends.
   */
  analyzeLeakPotential(latest) {
    // 1. Check absolute heap limit percentage
    if (latest.heapUsedPercent >= this.settings.heapLimitPercentage) {
      this.addWarning(
        "CRITICAL",
        `High Heap Allocation: Heap used is at ${latest.heapUsedPercent}% of the V8 threshold limit (${latest.heapUsed}MB / ${latest.heapLimit}MB).`
      );
    }

    // 2. Check for consecutive memory climbs (leak signature)
    if (this.snapshots.length >= 2) {
      const prev = this.snapshots[this.snapshots.length - 2];
      if (latest.heapUsed > prev.heapUsed) {
        this.climbCounter++;
      } else if (latest.heapUsed < prev.heapUsed) {
        // Reset or decay on garbage collection/drop
        this.climbCounter = Math.max(0, this.climbCounter - 1);
      }

      if (this.climbCounter >= this.settings.consecutiveClimbLimit) {
        this.addWarning(
          "WARNING",
          `Suspected Memory Leak: Heap allocation has risen consecutively for ${this.climbCounter} samples. Recent: ${prev.heapUsed}MB -> ${latest.heapUsed}MB.`
        );
      }
    }
  }

  /**
   * Append a warning stamp to the logs.
   */
  addWarning(severity, message) {
    const timestamp = new Date().toISOString();
    
    // Prevent spamming identical warnings within 10 seconds
    if (this.warnings.length > 0) {
      const last = this.warnings[this.warnings.length - 1];
      const duration = new Date() - new Date(last.timestamp);
      if (last.message === message && duration < 10000) {
        return;
      }
    }

    const warning = {
      timestamp,
      severity,
      message,
      memorySnapshot: this.snapshots[this.snapshots.length - 1] || null
    };

    this.warnings.push(warning);
    console.warn(`[MemoryProfiler] [${severity}] ${message}`);

    if (this.warnings.length > this.settings.maxWarnings) {
      this.warnings.shift();
    }
  }

  /**
   * Clear warning history.
   */
  clearWarnings() {
    this.warnings = [];
    this.climbCounter = 0;
    console.log(`[MemoryProfiler] Alerts and warnings cleared.`);
  }

  /**
   * Triggers Node.js garbage collection manually if exposed.
   */
  triggerGC() {
    if (global && typeof global.gc === 'function') {
      global.gc();
      this.takeSnapshot("manual_gc");
      return { success: true, message: "Garbage collection triggered successfully." };
    }
    return {
      success: false,
      message: "Garbage collection not exposed. Run node with '--expose-gc' to enable."
    };
  }

  /**
   * Formulates a comprehensive diagnostic report.
   */
  generateDiagnosticReport() {
    const latest = this.snapshots[this.snapshots.length - 1] || this.takeSnapshot("diagnostic_query");
    
    let status = "HEALTHY";
    if (this.warnings.some(w => w.severity === "CRITICAL")) {
      status = "CRITICAL";
    } else if (this.warnings.length > 0 || this.climbCounter >= 3) {
      status = "WARNING";
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      currentMemory: {
        rss: `${latest.rss} MB`,
        heapTotal: `${latest.heapTotal} MB`,
        heapUsed: `${latest.heapUsed} MB`,
        external: `${latest.external} MB`,
        arrayBuffers: `${latest.arrayBuffers} MB`,
        heapUsedPercent: `${latest.heapUsedPercent}%`
      },
      v8Statistics: {
        heapLimit: `${latest.heapLimit} MB`,
        consecutiveClimbs: this.climbCounter,
        totalRoomConnections: this.connectionCount
      },
      settings: this.settings,
      alerts: this.warnings,
      snapshots: this.snapshots
    };
  }
}

// Singleton instances pattern
module.exports = new MemoryProfilerService();
