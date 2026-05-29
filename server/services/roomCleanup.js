const cron = require('node-cron');
const { db } = require('./firebaseAdmin');
const logger = require('../utils/logger');

function startRoomCleanupCron() {
  if (!db) {
    logger.warn('[Room Cleanup] Cron job not started because Firebase Admin is not initialized.');
    return;
  }

  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('[Room Cleanup] Starting abandoned room cleanup job...');
    
    try {
      const now = new Date();
      // 24 hours ago
      const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Query rooms collection
      const roomsRef = db.collection('rooms');
      const snapshot = await roomsRef.get();
      
      let deletedCount = 0;
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const updatedAt = data.updatedAt?.toDate() || data.createdAt?.toDate();
        
        if (updatedAt && updatedAt < cutoffTime) {
          logger.info(`[Room Cleanup] Deleting abandoned room: ${doc.id}`);
          
          // Delete nested 'votes' subcollection if it exists
          const votesSnapshot = await doc.ref.collection('votes').get();
          for (const voteDoc of votesSnapshot.docs) {
            await voteDoc.ref.delete();
          }
          
          // Delete the room document
          await doc.ref.delete();
          deletedCount++;
        }
      }
      
      logger.info(`[Room Cleanup] Cleanup job completed. Deleted ${deletedCount} abandoned rooms.`);
    } catch (error) {
      logger.error(`[Room Cleanup] Error during cleanup job: ${error.message}`);
    }
  });

  logger.info('[Room Cleanup] Cron job scheduled to run daily at midnight.');
}

module.exports = { startRoomCleanupCron };
