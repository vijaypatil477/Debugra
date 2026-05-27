import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, updateDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { notifyRoomCreated, notifyRoomJoined } from '../services/webhookService';
import toast from 'react-hot-toast';

const ROOM_AUTH_PREFIX = 'debugra_roomAuth_';

async function hashRoomPassword(password, salt) {
  const encoded = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function createRoomSalt() {
  return crypto.randomUUID().replace(/-/g, '');
}

function rememberRoomAccess(roomId) {
  sessionStorage.setItem(`${ROOM_AUTH_PREFIX}${roomId}`, 'true');
}

function hasRememberedRoomAccess(roomId) {
  return sessionStorage.getItem(`${ROOM_AUTH_PREFIX}${roomId}`) === 'true';
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
  const isAuthor = roomData?.createdBy === user?.uid;
  const isAllowedEditor = roomData?.allowedEditors?.includes(user?.uid);
  const isCurrentEditor = roomData?.currentEditor === user?.uid;
  const isReadOnly = roomId ? !isCurrentEditor : false;
  const currentEditorName =
    activeUsers.find((u) => u.uid === roomData?.currentEditor)?.displayName || 'None';

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

  // ─── Push local changes (debounced, author-gated) ──────────────────────────
  useEffect(() => {
    if (!roomId || !user || !roomData) return;
    if (roomData.currentEditor !== user.uid) return;
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
  }, [code, language, stdinValue, roomId, user, roomData?.currentEditor]);

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
      const passwordSalt = trimmedPassword ? createRoomSalt() : null;
      const passwordHash = trimmedPassword
        ? await hashRoomPassword(trimmedPassword, passwordSalt)
        : null;
      const initialActiveUsers = [{ uid: user.uid, displayName }];

      await setDoc(doc(db, 'rooms', id), {
        name: `Room ${id}`,
        createdBy: user.uid,
        isPrivate: Boolean(passwordHash),
        passwordSalt,
        passwordHash,
        code,
        language,
        activeUsers: initialActiveUsers,
        allowedEditors: [user.uid],
        currentEditor: user.uid,
        editRequests: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setRoomId(id);
      localStorage.setItem('debugra_roomId', id);
      rememberRoomAccess(id);
      toast.success(`Room created! ID: ${id}`);
      navigator.clipboard.writeText(id);
      notifyRoomCreated({
        roomId: id,
        displayName,
        language,
        activeUserCount: initialActiveUsers.length,
      });

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
        const roomLanguage = data.language;
        const isCreator = data.createdBy === user.uid;
        const isAllowed = data.allowedEditors?.includes(user.uid);
        const needsPassword =
          data.passwordHash && !isCreator && !isAllowed && !hasRememberedRoomAccess(newRoomId);

        if (needsPassword) {
          const suppliedPassword = roomPassword.trim();
          if (!suppliedPassword) {
            toast.error('Room passcode required');
            return false;
          }

          const suppliedHash = await hashRoomPassword(suppliedPassword, data.passwordSalt);
          if (suppliedHash !== data.passwordHash) {
            toast.error('Invalid room passcode');
            return false;
          }
        }

        const displayName = user.displayName || user.email?.split('@')[0] || 'Guest';
        const isAlreadyActive = currentUsers.some((u) => u.uid === user.uid);

        if (!isAlreadyActive) {
          const nextActiveUsers = [...currentUsers, { uid: user.uid, displayName }];
          await updateDoc(roomRef, {
            activeUsers: nextActiveUsers,
          });

          notifyRoomJoined({
            roomId: newRoomId,
            displayName,
            language: roomLanguage,
            activeUserCount: nextActiveUsers.length,
          });
        }
        setRoomId(newRoomId);
        localStorage.setItem('debugra_roomId', newRoomId);
        rememberRoomAccess(newRoomId);
        toast.success(`Joined room: ${newRoomId}`);

        return true;
      } catch {
        toast.error('Failed to join room');
        return false;
      }
    },
    [user]
  );

  // ─── Access control ─────────────────────────────────────────────────────────
  const requestAccess = useCallback(async () => {
    if (!user || !roomId || !roomData) return;
    if (roomData.editRequests?.some((r) => r.uid === user.uid)) {
      toast.error('Access request already sent.');
      return;
    }
    const newRequests = [
      ...(roomData.editRequests || []),
      { uid: user.uid, displayName: user.displayName },
    ];
    await updateDoc(doc(db, 'rooms', roomId), { editRequests: newRequests });
    toast.success('Requested edit access from the author.');
  }, [user, roomId, roomData]);

  const approveAccess = useCallback(
    async (requestUid) => {
      if (!roomId || !roomData || !isAuthor) return;
      const newAllowed = [...new Set([...(roomData.allowedEditors || []), requestUid])];
      const newRequests = (roomData.editRequests || []).filter((r) => r.uid !== requestUid);
      await updateDoc(doc(db, 'rooms', roomId), {
        allowedEditors: newAllowed,
        editRequests: newRequests,
      });
      toast.success('Access granted.');
    },
    [roomId, roomData, isAuthor]
  );

  const denyAccess = useCallback(
    async (requestUid) => {
      if (!roomId || !roomData || !isAuthor) return;
      const newRequests = (roomData.editRequests || []).filter((r) => r.uid !== requestUid);
      await updateDoc(doc(db, 'rooms', roomId), { editRequests: newRequests });
      toast('Access denied.');
    },
    [roomId, roomData, isAuthor]
  );

  const revokeAccess = useCallback(
    async (revokeUid) => {
      if (!roomId || !roomData || !isAuthor) return;
      const newAllowed = (roomData.allowedEditors || []).filter((uid) => uid !== revokeUid);
      const updates = { allowedEditors: newAllowed };
      if (roomData.currentEditor === revokeUid) updates.currentEditor = null;
      await updateDoc(doc(db, 'rooms', roomId), updates);
      toast('Access revoked.');
    },
    [roomId, roomData, isAuthor]
  );

  const takeControl = useCallback(async () => {
    if (!user || !roomId || !isAllowedEditor) return;
    await updateDoc(doc(db, 'rooms', roomId), { currentEditor: user.uid });
    toast.success('You are now editing.');
  }, [user, roomId, isAllowedEditor]);

  const releaseControl = useCallback(async () => {
    if (!user || !roomId || !isCurrentEditor) return;
    await updateDoc(doc(db, 'rooms', roomId), { currentEditor: null });
    toast.success('You released the editor lock.');
  }, [user, roomId, isCurrentEditor]);

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

  return {
    roomId,
    roomData,
    activeUsers,
    showOnlineDropdown,
    setShowOnlineDropdown,
    showRequestsDropdown,
    setShowRequestsDropdown,
    isAuthor,
    isAllowedEditor,
    isCurrentEditor,
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
  };
}
