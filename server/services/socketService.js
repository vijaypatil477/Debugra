const { Server } = require('socket.io');
const admin = require('firebase-admin');
const logger = require('../utils/logger');

// In-memory cache for active rooms
// Format: { roomId: { code, language, stdin, activeUsers: [], lastSavedCode: string } }
const activeRooms = new Map();

function initSocketServer(server, allowedOrigins) {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
    },
  });

  io.on('connection', (socket) => {
    let currentRoomId = null;
    let currentUser = null;

    logger.info(`[Socket] Client connected: ${socket.id}`);

    // ─── Join Room ────────────────────────────────────────────────────────────
    socket.on('join-room', async ({ roomId, user, role }) => {
      if (!roomId || !user) return;

      currentRoomId = roomId;
      currentUser = user;
      socket.join(roomId);

      logger.info(`[Socket] User ${user.displayName} (${user.uid}) joined room ${roomId}`);

      // Initialize room cache if it doesn't exist
      if (!activeRooms.has(roomId)) {
        // Fetch current room state from Firestore to seed the cache
        let initialCode = '';
        let initialLanguage = 'python';
        let initialStdin = '';

        try {
          const db = admin.firestore();
          const roomSnap = await db.collection('rooms').doc(roomId).get();
          if (roomSnap.exists) {
            const data = roomSnap.data();
            initialCode = data.code || '';
            initialLanguage = data.language || 'python';
            initialStdin = data.stdinValue || '';
          }
        } catch (err) {
          logger.error(`[Socket] Failed to fetch room state from Firestore for ${roomId}: ${err.message}`);
        }

        activeRooms.set(roomId, {
          code: initialCode,
          language: initialLanguage,
          stdin: initialStdin,
          activeUsers: [],
          lastSavedCode: initialCode,
        });
      }

      const room = activeRooms.get(roomId);

      // Add user to active users list if not already present
      const existingUserIdx = room.activeUsers.findIndex((u) => u.uid === user.uid);
      const userData = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Guest',
        role: role || 'viewer',
        activeFile: room.language,
      };

      if (existingUserIdx === -1) {
        room.activeUsers.push(userData);
      } else {
        room.activeUsers[existingUserIdx] = userData;
      }

      // Emit presence update to all room members
      io.to(roomId).emit('presence-update', room.activeUsers);

      // Send current room state to the newly joined client
      socket.emit('room-state', {
        code: room.code,
        language: room.language,
        stdin: room.stdin,
        activeUsers: room.activeUsers,
      });
    });

    // ─── Code Updates ─────────────────────────────────────────────────────────
    socket.on('code-update', ({ roomId, code, language }) => {
      if (!roomId || !activeRooms.has(roomId)) return;

      const room = activeRooms.get(roomId);
      room.code = code;
      if (language) room.language = language;

      // Broadcast changes to all other clients in the room
      socket.to(roomId).emit('code-update', { code, language });
    });

    // ─── Stdin Updates ────────────────────────────────────────────────────────
    socket.on('stdin-update', ({ roomId, stdin }) => {
      if (!roomId || !activeRooms.has(roomId)) return;

      const room = activeRooms.get(roomId);
      room.stdin = stdin;

      // Broadcast changes to all other clients in the room
      socket.to(roomId).emit('stdin-update', { stdin });
    });

    // ─── Active File Updates ──────────────────────────────────────────────────
    socket.on('active-file-change', ({ roomId, language }) => {
      if (!roomId || !activeRooms.has(roomId) || !currentUser) return;

      const room = activeRooms.get(roomId);
      const u = room.activeUsers.find((user) => user.uid === currentUser.uid);
      if (u && u.activeFile !== language) {
        u.activeFile = language;
        io.to(roomId).emit('presence-update', room.activeUsers);
      }
    });

    // ─── Cursor movements ─────────────────────────────────────────────────────
    socket.on('cursor-move', ({ roomId, userId, line, col }) => {
      if (!roomId) return;
      // Broadcast cursor updates to other users in the room
      socket.to(roomId).emit('cursor-move', { userId, line, col });
    });

    // ─── Roles / Access Updates ───────────────────────────────────────────────
    socket.on('roles-update', ({ roomId, roles }) => {
      if (!roomId || !activeRooms.has(roomId)) return;
      socket.to(roomId).emit('roles-update', { roles });
    });

    // ─── Chat Messages ────────────────────────────────────────────────────────
    socket.on('chat-message', ({ roomId, message }) => {
      if (!roomId) return;
      // Broadcast message to other room members
      socket.to(roomId).emit('chat-message', message);
    });

    // ─── Disconnection & Cleanup ──────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.info(`[Socket] Client disconnected: ${socket.id}`);
      if (!currentRoomId || !currentUser) return;

      const roomId = currentRoomId;
      const user = currentUser;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        // Remove user from room's active users list
        room.activeUsers = room.activeUsers.filter((u) => u.uid !== user.uid);

        // Update presence for other users
        io.to(roomId).emit('presence-update', room.activeUsers);

        // If the room is now empty, save current code to Firestore and clean up cache
        if (room.activeUsers.length === 0) {
          logger.info(`[Socket] Room ${roomId} is empty. Persisting final state to Firestore...`);
          try {
            const db = admin.firestore();
            await db.collection('rooms').doc(roomId).update({
              code: room.code,
              language: room.language,
              stdinValue: room.stdin,
            });
            logger.info(`[Socket] Room ${roomId} successfully saved to Firestore.`);
          } catch (err) {
            logger.error(`[Socket] Failed to save empty room ${roomId} to Firestore: ${err.message}`);
          }
          activeRooms.delete(roomId);
        }
      }
    });
  });

  return io;
}

module.exports = { initSocketServer };
