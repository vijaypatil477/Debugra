import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { collection, doc, onSnapshot, setDoc, addDoc, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

export function useWebRTC(roomId, user) {
  const [inCall, setInCall] = useState(false);
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const peersRef = useRef({});
  const streamRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const joinCall = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setStream(mediaStream);
      streamRef.current = mediaStream;
      setInCall(true);
      toast.success("Joined Voice Channel");

      // Register self in the call
      const myParticipantRef = doc(db, 'rooms', roomId, 'voice_participants', user.uid);
      await setDoc(myParticipantRef, {
        uid: user.uid,
        joinedAt: serverTimestamp()
      });

      // Listen for other participants to connect to
      const participantsRef = collection(db, 'rooms', roomId, 'voice_participants');
      unsubscribeRef.current = onSnapshot(participantsRef, (snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (data.uid !== user.uid && !peersRef.current[data.uid]) {
              // Initiate peer connection to new participant
              const peer = createPeer(data.uid, user.uid, mediaStream);
              peersRef.current[data.uid] = peer;
            }
          }
          if (change.type === 'removed') {
            const data = change.doc.data();
            if (peersRef.current[data.uid]) {
              peersRef.current[data.uid].destroy();
              delete peersRef.current[data.uid];
              setPeers(prev => prev.filter(p => p.peerId !== data.uid));
            }
          }
        });
      });

      // Listen for incoming signals
      const signalsRef = collection(db, 'rooms', roomId, 'signals');
      const q = query(signalsRef, where('targetUid', '==', user.uid));
      onSnapshot(q, (snapshot) => {
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

    } catch (err) {
      console.error(err);
      toast.error("Could not access microphone.");
    }
  };

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: callerID > userToSignal,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      addDoc(collection(db, 'rooms', roomId, 'signals'), {
        targetUid: userToSignal,
        senderUid: callerID,
        signal: JSON.stringify(signal),
        createdAt: serverTimestamp()
      });
    });

    peer.on('stream', peerStream => {
      setPeers(prev => [...prev.filter(p => p.peerId !== userToSignal), { peerId: userToSignal, stream: peerStream }]);
    });

    peer.on('close', () => {
      if (peersRef.current[userToSignal]) {
        delete peersRef.current[userToSignal];
        setPeers(prev => prev.filter(p => p.peerId !== userToSignal));
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

    peer.on('signal', signal => {
      addDoc(collection(db, 'rooms', roomId, 'signals'), {
        targetUid: callerID,
        senderUid: user.uid,
        signal: JSON.stringify(signal),
        createdAt: serverTimestamp()
      });
    });

    peer.signal(JSON.parse(incomingSignal.signal));

    peer.on('stream', peerStream => {
      setPeers(prev => [...prev.filter(p => p.peerId !== callerID), { peerId: callerID, stream: peerStream }]);
    });

    peer.on('close', () => {
      if (peersRef.current[callerID]) {
        delete peersRef.current[callerID];
        setPeers(prev => prev.filter(p => p.peerId !== callerID));
      }
    });

    return peer;
  };

  const leaveCall = async () => {
    if (unsubscribeRef.current) unsubscribeRef.current();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    Object.values(peersRef.current).forEach(peer => peer.destroy());
    peersRef.current = {};
    
    setInCall(false);
    setStream(null);
    setPeers([]);

    // Remove self from participants
    await deleteDoc(doc(db, 'rooms', roomId, 'voice_participants', user.uid));
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
