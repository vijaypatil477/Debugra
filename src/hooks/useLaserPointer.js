import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';

// ─── Laser Pointer Colors ──────────────────────────────────────────────────────
const LASER_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#f9ca24',
  '#a29bfe',
  '#fd79a8',
  '#00b894',
  '#e17055',
  '#6c5ce7',
  '#00cec9',
];

const THROTTLE_MS = 80;
const STALE_MS = 8000;

/**
 * Deterministic color assignment based on UID hash.
 */
function getColorForUid(uid) {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = ((hash << 5) - hash + uid.charCodeAt(i)) | 0;
  }
  return LASER_COLORS[Math.abs(hash) % LASER_COLORS.length];
}

/**
 * useLaserPointer
 * Tracks the current user's mouse position within the editor and syncs it
 * to Firestore so other room members see a glowing laser dot.
 *
 * @param {string|null} roomId  - active room ID (null when not in a room)
 * @param {{ uid, displayName, email }|null} user - current Firebase user
 */
export function useLaserPointer({ roomId, user }) {
  const [remotePointers, setRemotePointers] = useState([]);
  const lastWriteRef = useRef(0);
  const activeRef = useRef(false);

  // ─── Listen for remote pointers ──────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !user) {
      setRemotePointers([]);
      return;
    }

    const colRef = collection(db, 'rooms', roomId, 'pointers');
    const unsub = onSnapshot(colRef, (snapshot) => {
      const now = Date.now();
      const pointers = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id === user.uid) return; // skip own pointer
        const data = docSnap.data();
        if (!data.active) return;

        // Filter stale pointers (disconnected users)
        const updatedAt = data.updatedAt?.toMillis?.() || 0;
        if (updatedAt > 0 && now - updatedAt > STALE_MS) return;

        pointers.push({ uid: docSnap.id, ...data });
      });
      setRemotePointers(pointers);
    });

    return unsub;
  }, [roomId, user?.uid]);

  // ─── Write local pointer position (throttled) ───────────────────────────
  const updatePointer = useCallback(
    (x, y) => {
      if (!roomId || !user) return;
      const now = Date.now();
      if (now - lastWriteRef.current < THROTTLE_MS) return;
      lastWriteRef.current = now;
      activeRef.current = true;

      const displayName = user.displayName || user.email?.split('@')[0] || 'Guest';
      const pointerRef = doc(db, 'rooms', roomId, 'pointers', user.uid);
      setDoc(
        pointerRef,
        {
          x,
          y,
          displayName,
          color: getColorForUid(user.uid),
          active: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    },
    [roomId, user]
  );

  // ─── Deactivate pointer (mouse leaves editor) ──────────────────────────
  const deactivatePointer = useCallback(() => {
    if (!roomId || !user || !activeRef.current) return;
    activeRef.current = false;

    const pointerRef = doc(db, 'rooms', roomId, 'pointers', user.uid);
    setDoc(pointerRef, { active: false }, { merge: true }).catch(() => {});
  }, [roomId, user]);

  // ─── Cleanup pointer document on unmount or room change ─────────────────
  useEffect(() => {
    const currentRoomId = roomId;
    const currentUid = user?.uid;

    return () => {
      if (currentRoomId && currentUid) {
        const pointerRef = doc(db, 'rooms', currentRoomId, 'pointers', currentUid);
        deleteDoc(pointerRef).catch(() => {});
      }
    };
  }, [roomId, user?.uid]);

  return {
    remotePointers,
    updatePointer,
    deactivatePointer,
  };
}
