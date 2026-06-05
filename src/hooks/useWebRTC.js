import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

const STALE_SIGNAL_MINUTES = 5;
const PARTICIPANT_HEARTBEAT_SECONDS = 30;
const STALE_PARTICIPANT_SECONDS = 90;

export function useWebRTC(roomId, user) {
  const [inCall, setInCall] = useState(false);
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const peersRef = useRef({});
  const streamRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const signalUnsubscribeRef = useRef(null);
  const heartbeatRef = useRef(null);
  const sweepIntervalRef = useRef(null);
  const sweepTimeoutRef = useRef(null);

  const joinCall = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setStream(mediaStream);
      streamRef.current = mediaStream;
      setInCall(true);
      toast.success('Joined Voice Channel');

      // Register self in the call with a heartbeat timestamp
      const now = Timestamp.now();
      const myParticipantRef = doc(db, 'rooms', roomId, 'voice_participants', user.uid);
      await setDoc(myParticipantRef, {
        uid: user.uid,
        joinedAt: serverTimestamp(),
        lastHeartbeat: now,
      });

      // Heartbeat loop — keeps participant presence alive
      heartbeatRef.current = setInterval(async () => {
        try {
          await setDoc(myParticipantRef, { lastHeartbeat: Timestamp.now() }, { merge: true });
        } catch (e) {
          // Ignore heartbeat failures
        }
      }, PARTICIPANT_HEARTBEAT_SECONDS * 1000);

      // Listen for other participants; ignore stale ones
      const participantsRef = collection(db, 'rooms', roomId, 'voice_participants');
      const staleThreshold = Timestamp.fromMillis(Date.now() - STALE_PARTICIPANT_SECONDS * 1000);
      const qParticipants = query(participantsRef, where('lastHeartbeat', '>', staleThreshold));
      unsubscribeRef.current = onSnapshot(qParticipants, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (data.uid !== user.uid && !peersRef.current[data.uid]) {
              const peer = createPeer(data.uid, user.uid, mediaStream);
              peersRef.current[data.uid] = peer;
            }
          }
          if (change.type === 'removed') {
            const data = change.doc.data();
            if (peersRef.current[data.uid]) {
              peersRef.current[data.uid].destroy();
              delete peersRef.current[data.uid];
              setPeers((prev) => prev.filter((p) => p.peerId !== data.uid));
            }
          }
        });
      });

      // Listen for incoming signals — only recent ones
      const signalsRef = collection(db, 'rooms', roomId, 'signals');
      const signalCutoff = Timestamp.fromMillis(Date.now() - STALE_SIGNAL_MINUTES * 60 * 1000);
      const q = query(
        signalsRef,
        where('targetUid', '==', user.uid),
        where('createdAt', '>', signalCutoff),
        orderBy('createdAt', 'asc')
      );
      const signalUnsub = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (!peersRef.current[data.senderUid]) {
              const peer = addPeer(data, data.senderUid, mediaStream);
              peersRef.current[data.senderUid] = peer;
            } else {
              peersRef.current[data.senderUid].signal(JSON.parse(data.signal));
            }
            // Clean up processed signals
            await deleteDoc(change.doc.ref);
          }
        });
      });
      signalUnsubscribeRef.current = signalUnsub;

      // Periodic sweep for stale signals left by disconnected peers
      sweepIntervalRef.current = setInterval(async () => {
        const sweepCutoff = Timestamp.fromMillis(Date.now() - STALE_SIGNAL_MINUTES * 60 * 1000);
        const staleSignals = query(signalsRef, where('createdAt', '<', sweepCutoff));
        const snapshot = await getDocs(staleSignals);
        snapshot.docs.forEach((d) => deleteDoc(d.ref));
      }, 2 * 60 * 1000);
      // Store sweep handle for cleanup
      sweepTimeoutRef.current = setTimeout(() => {
        if (sweepIntervalRef.current) {
          clearInterval(sweepIntervalRef.current);
          sweepIntervalRef.current = null;
        }
      }, 30 * 60 * 1000);
    } catch (err) {
      console.error(err);
      toast.error('Could not access microphone.');
    }
  };

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: callerID > userToSignal,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      addDoc(collection(db, 'rooms', roomId, 'signals'), {
        targetUid: userToSignal,
        senderUid: callerID,
        signal: JSON.stringify(signal),
        createdAt: serverTimestamp(),
      });
    });

    peer.on('stream', (peerStream) => {
      setPeers((prev) => [
        ...prev.filter((p) => p.peerId !== userToSignal),
        { peerId: userToSignal, stream: peerStream },
      ]);
    });

    peer.on('close', () => {
      if (peersRef.current[userToSignal]) {
        delete peersRef.current[userToSignal];
        setPeers((prev) => prev.filter((p) => p.peerId !== userToSignal));
      }
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      addDoc(collection(db, 'rooms', roomId, 'signals'), {
        targetUid: callerID,
        senderUid: user.uid,
        signal: JSON.stringify(signal),
        createdAt: serverTimestamp(),
      });
    });

    peer.signal(JSON.parse(incomingSignal.signal));

    peer.on('stream', (peerStream) => {
      setPeers((prev) => [
        ...prev.filter((p) => p.peerId !== callerID),
        { peerId: callerID, stream: peerStream },
      ]);
    });

    peer.on('close', () => {
      if (peersRef.current[callerID]) {
        delete peersRef.current[callerID];
        setPeers((prev) => prev.filter((p) => p.peerId !== callerID));
      }
    });

    return peer;
  };

  const leaveCall = async () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (unsubscribeRef.current) unsubscribeRef.current();
    if (signalUnsubscribeRef.current) {
      signalUnsubscribeRef.current();
      signalUnsubscribeRef.current = null;
    }
    if (sweepIntervalRef.current) {
      clearInterval(sweepIntervalRef.current);
      sweepIntervalRef.current = null;
    }
    if (sweepTimeoutRef.current) {
      clearTimeout(sweepTimeoutRef.current);
      sweepTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    Object.values(peersRef.current).forEach((peer) => peer.destroy());
    peersRef.current = {};

    setInCall(false);
    setStream(null);
    setPeers([]);

    // Remove self from participants
    await deleteDoc(doc(db, 'rooms', roomId, 'voice_participants', user.uid));

    // Clean up any stale signals left for this user from disconnected peers
    try {
      const signalsRef = collection(db, 'rooms', roomId, 'signals');
      const staleSignals = query(signalsRef, where('targetUid', '==', user.uid));
      const snapshot = await getDocs(staleSignals);
      snapshot.docs.forEach((d) => deleteDoc(d.ref));
    } catch (e) {
      // Best-effort cleanup
    }
  };

  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (inCall) leaveCall();
    };
  }, [inCall, roomId]);

  return { inCall, joinCall, leaveCall, isMuted, toggleMute, peers };
}
