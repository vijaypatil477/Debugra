const cron = require('node-cron');
const logger = require('../utils/logger');
const firebaseAdmin = require('./firebaseAdmin');

const HOUR_MS = 60 * 60 * 1000;

function envInt(name, fallback) {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * RoomCleanupService
 *
 * Deletes stale collaborative room documents (`rooms/{roomId}`) whose `updatedAt`
 * is older than ROOM_STALE_HOURS. Runs on a daily cron schedule and can also be
 * triggered manually via the admin endpoint (routes/adminCleanup.js).
 *
 * Uses the Admin SDK's recursiveDelete so each room's subcollections (e.g.
 * `votes`, `meta`) are removed too — a plain document delete would orphan them.
 *
 * Mirrors the singleton + start()/stop() pattern of services/memoryProfiler.js.
 */
class RoomCleanupService {
  constructor() {
    this.task = null;
    this.running = false;
    this.settings = {
      staleHours: envInt('ROOM_STALE_HOURS', 24),
      cronExpr: (process.env.ROOM_CLEANUP_CRON || '0 3 * * *').trim(), // 03:00 daily
      dryRun: String(process.env.ROOM_CLEANUP_DRY_RUN || '').toLowerCase() === 'true',
      batchSize: envInt('ROOM_CLEANUP_BATCH', 300),
      maxBatches: envInt('ROOM_CLEANUP_MAX_BATCHES', 100),
    };
  }

  /**
   * Schedule the recurring cleanup. No-op (with a warning) when the Admin SDK has
   * no credentials, so the rest of the server still boots and serves /execute & /ai.
   */
  start() {
    if (!firebaseAdmin.isConfigured) {
      logger.warn('[roomCleanup] Firebase Admin not configured — cleanup scheduler disabled.');
      return;
    }
    if (!cron.validate(this.settings.cronExpr)) {
      logger.error(`[roomCleanup] Invalid ROOM_CLEANUP_CRON "${this.settings.cronExpr}" — scheduler disabled.`);
      return;
    }
    if (this.task) this.task.stop();
    this.task = cron.schedule(this.settings.cronExpr, () => {
      this.runCleanup().catch((err) =>
        logger.error('[roomCleanup] Scheduled run failed: ' + err.message)
      );
    });
    logger.info(
      `[roomCleanup] Scheduled "${this.settings.cronExpr}" ` +
        `(staleHours=${this.settings.staleHours}, dryRun=${this.settings.dryRun}).`
    );
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('[roomCleanup] Scheduler stopped.');
    }
  }

  /**
   * Find and delete stale rooms. Safe to call manually.
   * @param {{ dryRun?: boolean }} [opts] override the configured dry-run flag.
   * @returns {Promise<object>} run summary
   */
  async runCleanup(opts = {}) {
    const dryRun = opts.dryRun === undefined ? this.settings.dryRun : Boolean(opts.dryRun);
    const startedAt = Date.now();

    if (!firebaseAdmin.isConfigured || !firebaseAdmin.db) {
      logger.warn('[roomCleanup] Run skipped — Firebase Admin not configured.');
      return { skipped: true, scanned: 0, deleted: 0, dryRun, durationMs: 0, errors: 0 };
    }
    if (this.running) {
      logger.warn('[roomCleanup] Run skipped — another cleanup is already in progress.');
      return { skipped: true, scanned: 0, deleted: 0, dryRun, durationMs: 0, errors: 0 };
    }

    this.running = true;
    const { admin, db } = firebaseAdmin;
    const cutoff = admin.firestore.Timestamp.fromMillis(
      Date.now() - this.settings.staleHours * HOUR_MS
    );
    const staleQuery = db.collection('rooms').where('updatedAt', '<', cutoff);

    try {
      if (dryRun) {
        const [countSnap, sampleSnap] = await Promise.all([
          staleQuery.count().get(),
          staleQuery.limit(20).get(),
        ]);
        const wouldDelete = countSnap.data().count;
        const sampleIds = sampleSnap.docs.map((d) => d.id);
        const durationMs = Date.now() - startedAt;
        logger.info(
          `[roomCleanup] [dry-run] ${wouldDelete} stale room(s) older than ${this.settings.staleHours}h.`
        );
        return { dryRun: true, scanned: wouldDelete, deleted: 0, wouldDelete, sampleIds, errors: 0, durationMs };
      }

      let scanned = 0;
      let deleted = 0;
      let errors = 0;
      for (let batch = 0; batch < this.settings.maxBatches; batch++) {
        const snap = await staleQuery.limit(this.settings.batchSize).get();
        if (snap.empty) break;

        scanned += snap.size;
        let progressed = 0;
        for (const docSnap of snap.docs) {
          try {
            await db.recursiveDelete(docSnap.ref); // deletes the room + its subcollections
            deleted++;
            progressed++;
          } catch (err) {
            errors++;
            logger.error(`[roomCleanup] Failed to delete room ${docSnap.id}: ${err.message}`);
          }
        }
        // Stop on the last page, or if a full page made no progress (all errored)
        // so a permanently-failing document can't loop forever.
        if (snap.size < this.settings.batchSize || progressed === 0) break;
      }

      const durationMs = Date.now() - startedAt;
      logger.info(
        `[roomCleanup] scanned=${scanned} deleted=${deleted} errors=${errors} in ${durationMs}ms ` +
          `(older than ${this.settings.staleHours}h).`
      );
      return { dryRun: false, scanned, deleted, errors, durationMs };
    } finally {
      this.running = false;
    }
  }
}

module.exports = new RoomCleanupService();
