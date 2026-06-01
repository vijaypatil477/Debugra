import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

const ROOM_AUTH_PREFIX = 'debugra_roomAuth_';

async function verifyRoomPassword(roomId, password) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const res = await fetch(`${apiUrl}/api/rooms/verify-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Password verification failed.');
  }

  sessionStorage.setItem(
    `${ROOM_AUTH_PREFIX}${roomId}`,
    JSON.stringify({
      accessToken: data.accessToken,
      expiresAt: data.expiresAt,
    })
  );

  return true;
}

async function hasValidRoomAccess(roomId) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const stored = sessionStorage.getItem(`${ROOM_AUTH_PREFIX}${roomId}`);

  if (!stored) return false;

  try {
    const { accessToken, expiresAt } = JSON.parse(stored);
    if (Date.now() >= expiresAt) {
      sessionStorage.removeItem(`${ROOM_AUTH_PREFIX}${roomId}`);
      return false;
    }

    const res = await fetch(`${apiUrl}/api/rooms/validate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, accessToken }),
    });

    if (res.ok) return true;
  } catch {
    // corrupted storage or network issue; fall through to remove token
  }

  sessionStorage.removeItem(`${ROOM_AUTH_PREFIX}${roomId}`);
  return false;
}

/**
 * useRoom
 * Manages all Firebase Firestore room state:
 *   - Creating and joining rooms
 *   - Real-time code/language sync
 *   - Access control (request, approve, deny, revoke, take/release)
 *   - Active user presence list
 *
 * @param {{ uid, displayName, email }} user - the current Firebase user
 * @param {string} code - current editor code (for syncing)
 * @param {string} language - current editor language
 * @param {string} stdinValue - current stdin value
 * @param {Function} setCode - to apply remote code changes
 * @param {Function} setLanguage - to apply remote language changes
 * @param {Function} setStdinValue - to apply remote stdin changes
 */
export function useRoom({ user, code, language, stdinValue, setCode, setLanguage, setStdinValue }) {
  const [roomId, setRoomId] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showOnlineDropdown, setShowOnlineDropdown] = useState(false);
  const [showRequestsDropdown, setShowRequestsDropdown] = useState(false);

  // ─── Derived permissions ────────────────────────────────────────────────────
  const myRole = roomId
    ? roomData?.roles?.[user?.uid] || (roomData?.createdBy === user?.uid ? 'host' : 'viewer')
    : 'host';
  const isHost = !roomId || myRole === 'host';
  const isEditor = !roomId || myRole === 'editor' || isHost;
  const isReadOnly = roomId ? !isEditor : false;
  const currentEditorName = isEditor ? user?.displayName || 'Editor' : 'Viewer';

  // ─── Live sync from Firestore ───────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setRoomData(data);
      if (data.code !== undefined && data._lastEditor !== user?.uid) setCode(data.code);
      if (data.language) setLanguage(data.language);
      if (data.stdin !== undefined && data._lastEditor !== user?.uid) setStdinValue(data.stdin);
      setActiveUsers(data.activeUsers || []);
    });
    return unsub;
  }, [roomId, user]);

  // ─── Push local changes (debounced, editor-gated) ──────────────────────────
  useEffect(() => {
    if (!roomId || !user || !roomData) return;
    if (!isEditor) return;
    const timer = setTimeout(() => {
      updateDoc(doc(db, 'rooms', roomId), {
        code,
        language,
        stdin: stdinValue,
        _lastEditor: user.uid,
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [code, language, stdinValue, roomId, user, isEditor]);

  // ─── Sync active file (language) for presence ───────────────────────────────
  useEffect(() => {
    if (!roomId || !user || !roomData) return;
    const currentUsers = roomData.activeUsers || [];
    const myIndex = currentUsers.findIndex((u) => u.uid === user.uid);
    if (myIndex !== -1 && currentUsers[myIndex].activeFile !== language) {
      const newUsers = [...currentUsers];
      newUsers[myIndex] = { ...newUsers[myIndex], activeFile: language };
      updateDoc(doc(db, 'rooms', roomId), { activeUsers: newUsers }).catch(() => {});
    }
  }, [roomId, user, roomData, language]);


  // ─── Auto-join from local storage ───────────────────────────────────────────
  useEffect(() => {
    const savedRoomId = localStorage.getItem('debugra_roomId');
    if (user && savedRoomId && !roomId) {
      joinRoom(savedRoomId).catch(() => {
        localStorage.removeItem('debugra_roomId');
      });
    }
  }, [user, roomId]); // Join logic uses the function below

  // ─── Create room ────────────────────────────────────────────────────────────
  const createRoom = useCallback(
    async (roomPassword = '') => {
      if (!user) return false; // let caller show auth modal
      const id = crypto.randomUUID().slice(0, 8);
      const displayName = user.displayName || user.email?.split('@')[0] || 'Guest';
      const trimmedPassword = roomPassword.trim();
      const passwordProtected = Boolean(trimmedPassword);

      await setDoc(doc(db, 'rooms', id), {
        name: `Room ${id}`,
        createdBy: user.uid,
        isPrivate: passwordProtected,
        passwordProtected,
        code,
        language,
        activeUsers: [{ uid: user.uid, displayName }],
        roles: { [user.uid]: 'host' },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setRoomId(id);
      localStorage.setItem('debugra_roomId', id);
      toast.success(`Room created! ID: ${id}`);
      navigator.clipboard.writeText(id);

      // Trigger Webhook via Backend API
      fetch(import.meta.env.VITE_API_URL + '/api/webhooks/room-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'room_created',
          roomId: id,
          userName: displayName,
          passwordProtected,
        }),
      }).catch(console.error);

      return true;
    },
    [user, code, language]
  );

  // ─── Join room ──────────────────────────────────────────────────────────────
  const joinRoom = useCallback(
    async (joinId, roomPassword = '') => {
      if (!user || !joinId.trim()) return false;
      const newRoomId = joinId.trim();
      try {
        const roomRef = doc(db, 'rooms', newRoomId);
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) {
          toast.error('Room not found');
          return false;
        }
        const data = roomSnap.data();
        const currentUsers = data.activeUsers || [];
        const isCreator = data.createdBy === user.uid;
        const isAllowed = data.allowedEditors?.includes(user.uid);
        const requiresPassword =
          Boolean(data.passwordProtected || data.isPrivate) && !isCreator && !isAllowed;

        if (requiresPassword) {
          const alreadyAuthorized = await hasValidRoomAccess(newRoomId);
          if (!alreadyAuthorized) {
            const suppliedPassword = roomPassword.trim();
            if (!suppliedPassword) {
              toast.error('Room passcode required');
              return false;
            }

            await verifyRoomPassword(newRoomId, suppliedPassword);
          }
        }

        const displayName = user.displayName || user.email?.split('@')[0] || 'Guest';
        const newRoles = { ...(data.roles || {}) };
        if (!newRoles[user.uid]) newRoles[user.uid] = 'viewer';

        if (!currentUsers.some((u) => u.uid === user.uid)) {
          await updateDoc(roomRef, {
            activeUsers: [...currentUsers, { uid: user.uid, displayName }],
            roles: newRoles,
          });
        } else if (!data.roles || !data.roles[user.uid]) {
          await updateDoc(roomRef, { roles: newRoles });
        }
        setRoomId(newRoomId);
        localStorage.setItem('debugra_roomId', newRoomId);
        toast.success(`Joined room: ${newRoomId}`);

        // Trigger Webhook via Backend API
        fetch(import.meta.env.VITE_API_URL + '/api/webhooks/room-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'room_joined',
            roomId: newRoomId,
            userName: displayName,
          }),
        }).catch(console.error);

        return true;
      } catch (err) {
        toast.error(err?.message || 'Failed to join room');
        return false;
      }
    },
    [user]
  );

  // (Legacy access control methods removed for simpler role system)
  const requestAccess = useCallback(() => {}, []);
  const approveAccess = useCallback(() => {}, []);
  const denyAccess = useCallback(() => {}, []);
  const revokeAccess = useCallback(() => {}, []);
  const takeControl = useCallback(() => {}, []);
  const releaseControl = useCallback(() => {}, []);

  const leaveRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      localStorage.removeItem('debugra_roomId');
      if (user && roomData) {
        const newUsers = (roomData.activeUsers || []).filter((u) => u.uid !== user.uid);
        await updateDoc(doc(db, 'rooms', roomId), { activeUsers: newUsers }).catch(() => {});
      }
    } catch (e) {
      console.error(e);
    }
    setRoomId(null);
    setRoomData(null);
    setActiveUsers([]);
    toast.success('Left the room');
  }, [roomId, user, roomData]);

  // ─── Execution Voting & Results Sync ──────────────────────────────────────────
  const startExecutionVote = useCallback(
    async (code, language, stdin) => {
      if (!roomId || !user) return;

      // Custom fallback random UUID generator
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
          return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      const voteId = generateUUID();

      // Store full code/stdin payload in separate Firestore document to avoid document size limit (1MB limit)
      const fullVoteRef = doc(db, 'rooms', roomId, 'votes', voteId);
      await setDoc(fullVoteRef, {
        code,
        language,
        stdin: stdin || '',
        createdAt: serverTimestamp(),
      });

      // Store lightweight previews in main room document to minimize write amplification and size
      const activeVote = {
        voteId,
        initiatorUid: user.uid,
        initiatorName: user.displayName || 'Guest',
        codePreview:
          code.length > 800 ? code.slice(0, 800) + '\n... [truncated for size limits]' : code,
        stdinPreview:
          stdin && stdin.length > 150 ? stdin.slice(0, 150) + '... [truncated]' : stdin || '',
        language,
        approvals: [user.uid], // initiator pre-approves
        rejections: [],
        status: 'voting',
        createdAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'rooms', roomId), { activeVote });
      toast.success('Started a vote for code execution!');
    },
    [roomId, user]
  );

  const castVote = useCallback(
    async (voteType) => {
      if (!roomId || !user) return;

      const roomRef = doc(db, 'rooms', roomId);
      try {
        await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw new Error('Room does not exist');

          const data = roomDoc.data();
          const activeVote = data.activeVote;
          if (!activeVote || activeVote.status !== 'voting') {
            throw new Error('No active vote in progress');
          }

          const approvals = [...(activeVote.approvals || [])];
          const rejections = [...(activeVote.rejections || [])];

          if (voteType === 'approve') {
            if (!approvals.includes(user.uid)) approvals.push(user.uid);
            const rejIdx = rejections.indexOf(user.uid);
            if (rejIdx > -1) rejections.splice(rejIdx, 1);
          } else if (voteType === 'reject') {
            if (!rejections.includes(user.uid)) rejections.push(user.uid);
            const appIdx = approvals.indexOf(user.uid);
            if (appIdx > -1) approvals.splice(appIdx, 1);
          }

          activeVote.approvals = approvals;
          activeVote.rejections = rejections;

          // Consensus threshold: strictly greater than 50% for BOTH approved and rejected (symmetry)
          const totalUsersCount = (data.activeUsers || []).length;
          if (approvals.length > totalUsersCount / 2) {
            activeVote.status = 'approved';
          } else if (rejections.length > totalUsersCount / 2) {
            activeVote.status = 'rejected';
          }

          transaction.update(roomRef, { activeVote });
        });
      } catch (error) {
        console.error('Voting transaction failed: ', error);
        toast.error(error.message || 'Failed to cast vote');
      }
    },
    [roomId, user]
  );

  const clearVote = useCallback(async () => {
    if (!roomId) return;
    await updateDoc(doc(db, 'rooms', roomId), { activeVote: null });
  }, [roomId]);

  const syncExecutionResult = useCallback(
    async (result) => {
      if (!roomId) return;
      const cappedResult = { ...result };
      // Cap output payload sizes to 10k characters to prevent document size limit errors & heavy traffic
      if (cappedResult.stdout && cappedResult.stdout.length > 10000) {
        cappedResult.stdout =
          cappedResult.stdout.slice(0, 10000) + '\n... [stdout truncated due to size limits]';
      }
      if (cappedResult.stderr && cappedResult.stderr.length > 10000) {
        cappedResult.stderr =
          cappedResult.stderr.slice(0, 10000) + '\n... [stderr truncated due to size limits]';
      }
      await updateDoc(doc(db, 'rooms', roomId), { executionResult: cappedResult });
    },
    [roomId]
  );

  const clearExecutionResult = useCallback(async () => {
    if (!roomId) return;
    await updateDoc(doc(db, 'rooms', roomId), { executionResult: null });
  }, [roomId]);

  const fetchFullVotePayload = useCallback(
    async (voteId) => {
      if (!roomId) return null;
      try {
        const voteSnap = await getDoc(doc(db, 'rooms', roomId, 'votes', voteId));
        if (voteSnap.exists()) {
          return voteSnap.data();
        }
      } catch (e) {
        console.error('Failed to fetch full vote payload:', e);
      }
      return null;
    },
    [roomId]
  );

  const transitionVoteToExecuting = useCallback(
    async (voteId) => {
      if (!roomId || !user) return false;
      const roomRef = doc(db, 'rooms', roomId);
      try {
        let transitioned = false;
        await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) return;
          const data = roomDoc.data();
          const activeVote = data.activeVote;
          if (activeVote && activeVote.voteId === voteId && activeVote.status === 'approved') {
            activeVote.status = 'executing';
            transaction.update(roomRef, { activeVote });
            transitioned = true;
          }
        });
        return transitioned;
      } catch (e) {
        console.error('Failed to transition vote status:', e);
        return false;
      }
    },
    [roomId, user]
  );

  return {
    roomId,
    roomData,
    activeUsers,
    showOnlineDropdown,
    setShowOnlineDropdown,
    showRequestsDropdown,
    setShowRequestsDropdown,
    isHost,
    isEditor,
    isReadOnly,
    currentEditorName,
    createRoom,
    joinRoom,
    requestAccess,
    approveAccess,
    denyAccess,
    revokeAccess,
    takeControl,
    releaseControl,
    leaveRoom,
    startExecutionVote,
    castVote,
    clearVote,
    syncExecutionResult,
    clearExecutionResult,
    fetchFullVotePayload,
    transitionVoteToExecuting,
  };
}
