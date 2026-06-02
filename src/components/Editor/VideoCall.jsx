import { useState, useRef, useEffect, useCallback } from 'react';
import { db } from '../../services/firebase';
import {
  doc,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import './VideoCall.css';

/**
 * VideoCall – a premium WebRTC group video call widget
 * built on top of Firestore as a high-performance mesh signaling grid.
 *
 * Support for HD video, screen sharing, and beautiful glassmorphism.
 */

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const VideoCall = ({ roomId, userName, onClose, audioOnly = false }) => {
  // Test-only flag: when URL contains ?testLocal=1 we render a static local meter
  // This avoids depending on getUserMedia / AudioContext in headless test environments.
  let isTestLocal = false;
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      isTestLocal = params.get('testLocal') === '1';
    }
  } catch (e) {
    isTestLocal = false;
  }
  const [peers, setPeers] = useState(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState(null);

  // Whiteboard state
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#a78bfa'); // Sleek Neon Purple
  const [brushWidth, setBrushWidth] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [strokes, setStrokes] = useState([]);

  const canvasRef = useRef(null);
  const currentStrokePoints = useRef([]);

  const localVideoRef = useRef(null);
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const localAnalyserRef = useRef(null);
  const localDataRef = useRef(null);
  const localRafRef = useRef(null);
  const [localLevel, setLocalLevel] = useState(0);

  // Generate a persistent, session-unique ID for the local peer
  const myPeerId = useRef(crypto.randomUUID().slice(0, 8)).current;

  // ── Acquire local media ──────────────────────────
  const startLocalStream = useCallback(async () => {
    try {
      const constraints = audioOnly
        ? { audio: { echoCancellation: true, noiseSuppression: true }, video: false }
        : {
            video: {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              facingMode: 'user',
            },
            audio: { echoCancellation: true, noiseSuppression: true },
          };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (!audioOnly && localVideoRef.current) localVideoRef.current.srcObject = stream;
      // Setup local analyser will be done by caller when stream is available
      setConnectionStatus('ready');
      return stream;
    } catch (err) {
      console.error('Failed to get user media:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera/microphone access was denied. Please allow access and try again.'
          : `Failed to access media devices: ${err.message}`
      );
      setConnectionStatus('error');
      return null;
    }
  }, [audioOnly]);

  useEffect(() => {
    startLocalStream().then((stream) => {
      if (stream && stream.getAudioTracks().length) setupLocalAnalyser(stream);
    });
    const currentPeers = peersRef.current;
    return () => {
      // Cleanup tracks on unmount
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      currentPeers.forEach((peerObj) => {
        peerObj.connection.close();
        if (peerObj.unsubConnection) peerObj.unsubConnection();
        if (peerObj.unsubCandidates) peerObj.unsubCandidates();
        if (peerObj.raf) cancelAnimationFrame(peerObj.raf);
        try {
          peerObj.analyserSource?.disconnect();
          peerObj.analyser?.disconnect();
        } catch (e) {
          console.warn('Error disconnecting peer analyser', e);
        }
      });
      // stop local analyser
      if (localRafRef.current) cancelAnimationFrame(localRafRef.current);
      try {
        localAnalyserRef.current?.disconnect();
        audioCtxRef.current?.close();
      } catch (e) {
        console.warn('Error closing local analyser/audio context', e);
      }
    };
  }, [startLocalStream]);

  const ensureAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const setupLocalAnalyser = useCallback((stream) => {
    try {
      const audioCtx = ensureAudioContext();
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const data = new Uint8Array(analyser.frequencyBinCount);
      src.connect(analyser);
      localAnalyserRef.current = analyser;
      localDataRef.current = data;

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        // compute normalized RMS
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = data[i] - 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length) / 128;
        setLocalLevel(Math.min(1, rms));
        localRafRef.current = requestAnimationFrame(tick);
      };
      localRafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.error('Local analyser setup failed', e);
    }
  }, []);

  // Update Firestore presence details
  const updatePresence = useCallback(
    async (updates) => {
      if (!roomId) return;
      try {
        const myCallRef = doc(db, 'rooms', roomId, 'calls', myPeerId);
        await updateDoc(myCallRef, updates);
      } catch (e) {
        console.error('Error updating presence:', e);
      }
    },
    [roomId, myPeerId]
  );

  // Setup single peer RTCPeerConnection in the full-mesh signaling grid
  const setupPeerConnection = useCallback(
    async (peerId, peerData) => {
      if (peersRef.current.has(peerId)) return;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const peerObj = {
        id: peerId,
        connection: pc,
        unsubConnection: null,
        unsubCandidates: null,
      };
      peersRef.current.set(peerId, peerObj);

      let remoteDescriptionSet = false;
      const remoteCandidatesQueue = [];

      const flushRemoteCandidates = async () => {
        remoteDescriptionSet = true;
        while (remoteCandidatesQueue.length > 0) {
          const candidate = remoteCandidatesQueue.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding queued remote ice candidate:', e);
          }
        }
      };

      // Add local tracks to this connection
      const streamToShare = screenStreamRef.current || localStreamRef.current;
      if (streamToShare) {
        streamToShare.getTracks().forEach((track) => {
          pc.addTrack(track, streamToShare);
        });
      }

      // Track incoming remote tracks
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        setPeers((prev) => {
          const next = new Map(prev);
          const p = next.get(peerId) || { id: peerId, ...peerData };
          p.stream = remoteStream;
          next.set(peerId, p);
          return next;
        });

        // Setup per-peer analyser for mic activity
        try {
          if (remoteStream && remoteStream.getAudioTracks().length) {
            const audioCtx = ensureAudioContext();
            const src = audioCtx.createMediaStreamSource(remoteStream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            const data = new Uint8Array(analyser.frequencyBinCount);
            src.connect(analyser);

            const tickPeer = () => {
              analyser.getByteTimeDomainData(data);
              let sum = 0;
              for (let i = 0; i < data.length; i++) {
                const v = data[i] - 128;
                sum += v * v;
              }
              const rms = Math.sqrt(sum / data.length) / 128;
              setPeers((prev) => {
                const next = new Map(prev);
                const existing = next.get(peerId) || { id: peerId };
                existing.volume = Math.min(1, rms);
                next.set(peerId, existing);
                return next;
              });
              peerObj.raf = requestAnimationFrame(tickPeer);
            };
            peerObj.analyser = analyser;
            peerObj.analyserSource = src;
            peerObj.raf = requestAnimationFrame(tickPeer);
          }
        } catch (e) {
          console.error('Peer analyser setup failed', e);
        }
      };

      // Handle local ICE candidates and publish them to Firestore
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const connectionId =
            myPeerId < peerId ? `${myPeerId}_${peerId}` : `${peerId}_${myPeerId}`;
          const candidatesCol = collection(
            db,
            'rooms',
            roomId,
            'connections',
            connectionId,
            'candidates'
          );
          addDoc(candidatesCol, {
            sender: myPeerId,
            candidate: event.candidate.toJSON(),
            createdAt: serverTimestamp(),
          }).catch((err) => console.error('Error sending ice candidate:', err));
        }
      };

      const connectionId = myPeerId < peerId ? `${myPeerId}_${peerId}` : `${peerId}_${myPeerId}`;
      const connectionRef = doc(db, 'rooms', roomId, 'connections', connectionId);

      // Listen to incoming ICE candidates from the other peer
      const candidatesCol = collection(
        db,
        'rooms',
        roomId,
        'connections',
        connectionId,
        'candidates'
      );
      peerObj.unsubCandidates = onSnapshot(candidatesCol, (snap) => {
        snap.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (data.sender !== myPeerId) {
              if (remoteDescriptionSet || pc.remoteDescription) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                  console.error('Error adding remote ice candidate:', e);
                }
              } else {
                remoteCandidatesQueue.push(data.candidate);
              }
            }
          }
        });
      });

      // Peer signaling role: lexicographical lower ID initiates the offer
      if (myPeerId < peerId) {
        // Offer side (Initiator)
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await setDoc(connectionRef, {
          offer: { type: offer.type, sdp: offer.sdp },
          initiator: myPeerId,
          receiver: peerId,
          createdAt: serverTimestamp(),
        });

        peerObj.unsubConnection = onSnapshot(connectionRef, async (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.answer && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              await flushRemoteCandidates();
            }
          }
        });
      } else {
        // Answer side (Receiver)
        peerObj.unsubConnection = onSnapshot(connectionRef, async (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.offer && !pc.currentLocalDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await updateDoc(connectionRef, {
                answer: { type: answer.type, sdp: answer.sdp },
              });
              await flushRemoteCandidates();
            }
          }
        });
      }

      setPeers((prev) => {
        const next = new Map(prev);
        next.set(peerId, { id: peerId, ...peerData, stream: null });
        return next;
      });
    },
    [roomId, myPeerId]
  );

  // Connect peers and listen to room calls once stream is ready
  useEffect(() => {
    if (!roomId || connectionStatus !== 'ready') return;

    // Publish local peer presence initial document
    const myCallRef = doc(db, 'rooms', roomId, 'calls', myPeerId);
    setDoc(myCallRef, {
      id: myPeerId,
      name: userName || 'Anonymous',
      joinedAt: serverTimestamp(),
      isVideoOff: false,
      isMuted: false,
      isScreenSharing: false,
    }).catch((e) => console.error('Error publishing presence:', e));

    // Listen to call participants
    const callsCol = collection(db, 'rooms', roomId, 'calls');
    const unsubCalls = onSnapshot(callsCol, async (snapshot) => {
      const activeIds = new Set();
      const updatedPeersData = new Map();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.id && data.id !== myPeerId) {
          activeIds.add(data.id);
          updatedPeersData.set(data.id, data);
        }
      });

      // Cleanup peers who left
      peersRef.current.forEach((peerObj, peerId) => {
        if (!activeIds.has(peerId)) {
          peerObj.connection.close();
          if (peerObj.unsubConnection) peerObj.unsubConnection();
          if (peerObj.unsubCandidates) peerObj.unsubCandidates();
          if (peerObj.raf) cancelAnimationFrame(peerObj.raf);
          try {
            peerObj.analyserSource?.disconnect();
            peerObj.analyser?.disconnect();
          } catch (e) {
            console.warn('Error disconnecting peer analyser', e);
          }
          peersRef.current.delete(peerId);
          setPeers((prev) => {
            const next = new Map(prev);
            next.delete(peerId);
            return next;
          });
        }
      });

      // Initiate or update active connections
      for (const [peerId, peerData] of updatedPeersData) {
        if (!peersRef.current.has(peerId)) {
          await setupPeerConnection(peerId, peerData);
        } else {
          // Update details (e.g., handles screenshare or mute state changes)
          setPeers((prev) => {
            const next = new Map(prev);
            const existing = next.get(peerId);
            if (existing) {
              next.set(peerId, { ...existing, ...peerData });
            }
            return next;
          });
        }
      }
    });

    return () => {
      unsubCalls();
      deleteDoc(myCallRef).catch((e) => console.error('Error clearing presence document:', e));
    };
  }, [roomId, connectionStatus, userName, myPeerId, setupPeerConnection]);

  // Sync active presence details (mute, video, screenshare) when state changes
  useEffect(() => {
    if (!roomId || connectionStatus !== 'ready') return;
    updatePresence({
      isMuted,
      isVideoOff,
      isScreenSharing,
    });
  }, [roomId, connectionStatus, isMuted, isVideoOff, isScreenSharing, updatePresence]);

  // ── Toggle controls ──────────────────────────────
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !nextMuted));
    setIsMuted(nextMuted);
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const nextVideoOff = !isVideoOff;
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !nextVideoOff));
    setIsVideoOff(nextVideoOff);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;

      // Revert track to local camera
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        peersRef.current.forEach((peerObj) => {
          const sender = peerObj.connection?.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(camTrack).catch((err) => console.error(err));
        });
      }

      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 },
            frameRate: { ideal: 30, max: 60 },
          },
          audio: false,
        });
        screenStreamRef.current = screen;
        const screenTrack = screen.getVideoTracks()[0];

        // Replace outgoing track for all peer connections
        peersRef.current.forEach((peerObj) => {
          const sender = peerObj.connection?.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack).catch((err) => console.error(err));
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screen;
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    }
  };

  const hangUp = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;

    peersRef.current.forEach((peerObj, peerId) => {
      peerObj.connection.close();
      if (peerObj.unsubConnection) peerObj.unsubConnection();
      if (peerObj.unsubCandidates) peerObj.unsubCandidates();

      // Clean up connection documents in Firestore
      const connectionId = myPeerId < peerId ? `${myPeerId}_${peerId}` : `${peerId}_${myPeerId}`;
      const connectionRef = doc(db, 'rooms', roomId, 'connections', connectionId);
      deleteDoc(connectionRef).catch((e) => console.warn('Failed to clean up WebRTC connection document:', e));
    });
    peersRef.current.clear();
    setPeers(new Map());

    onClose?.();
  };

  // ── Whiteboard Syncing & Event Handlers ───────────
  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, 'rooms', roomId, 'drawings'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      const remoteStrokes = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStrokes(remoteStrokes);
    });
  }, [roomId]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Premium dark canvas background color
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dynamic grid lines for that blueprint/technical feel
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Render each stroke
    strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const first = stroke.points[0];
      ctx.moveTo(first.x * canvas.width, first.y * canvas.height);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      }
      ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas, showWhiteboard]);

  const handleStartDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return;

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    setIsDrawing(true);
    currentStrokePoints.current = [{ x, y }];

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = isEraser ? '#0d0d1a' : brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(x * canvas.width, y * canvas.height);
  };

  const handleDrawing = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return;

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    currentStrokePoints.current.push({ x, y });

    const ctx = canvas.getContext('2d');
    ctx.lineTo(x * canvas.width, y * canvas.height);
    ctx.stroke();
  };

  const handleStopDraw = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStrokePoints.current.length > 1 && roomId) {
      try {
        await addDoc(collection(db, 'rooms', roomId, 'drawings'), {
          points: currentStrokePoints.current,
          color: isEraser ? '#0d0d1a' : brushColor,
          width: brushWidth,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Failed to sync drawing:', err);
      }
    }
    currentStrokePoints.current = [];
  };

  const clearCanvas = async () => {
    if (!roomId) return;
    try {
      const deletePromises = strokes.map((s) =>
        deleteDoc(doc(db, 'rooms', roomId, 'drawings', s.id))
      );
      await Promise.all(deletePromises);
    } catch (err) {
      console.error('Failed to clear canvas:', err);
    }
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas data to PNG Data URL
    const dataUrl = canvas.toDataURL('image/png');

    // Create a temporary virtual link to trigger instant download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `whiteboard-${roomId || 'session'}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Render ───────────────────────────────────────
  return (
    <div className="vc-overlay">
      <div className="vc-container">
        <div className="vc-header">
          <div className="vc-room-info">
            <span className="vc-room-icon">📹</span>
            <span className="vc-room-name">Room: {roomId || 'Local'}</span>
            <span className={`vc-status vc-status--${connectionStatus}`}>
              {connectionStatus === 'ready'
                ? '● Connected'
                : connectionStatus === 'error'
                  ? '● Error'
                  : '○ Connecting'}
            </span>
          </div>
          <button className="vc-close-btn" onClick={hangUp} aria-label="Close video call">
            ×
          </button>
        </div>

        {error && (
          <div className="vc-error">
            <span>⚠️ {error}</span>
            <button
              onClick={() => {
                setError(null);
                startLocalStream();
              }}
            >
              Retry
            </button>
          </div>
        )}

        <div className={`vc-body-layout ${showWhiteboard ? 'vc-body-layout--split' : ''}`}>
          {showWhiteboard && (
            <div className="vc-whiteboard-panel">
              <div className="vc-whiteboard-tools">
                <div className="vc-tool-section">
                  <span className="vc-tool-label">Colors:</span>
                  <div className="vc-color-palette">
                    {[
                      { value: '#a78bfa', label: 'Purple' },
                      { value: '#38bdf8', label: 'Blue' },
                      { value: '#4ade80', label: 'Green' },
                      { value: '#fb7185', label: 'Coral' },
                      { value: '#f8f8f2', label: 'White' },
                    ].map((color) => (
                      <button
                        key={color.value}
                        className={`vc-color-btn ${brushColor === color.value && !isEraser ? 'vc-color-btn--active' : ''}`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => {
                          setBrushColor(color.value);
                          setIsEraser(false);
                        }}
                        title={color.label}
                      />
                    ))}
                    <button
                      className={`vc-eraser-btn ${isEraser ? 'vc-eraser-btn--active' : ''}`}
                      onClick={() => setIsEraser(true)}
                      title="Eraser"
                    >
                      🧽
                    </button>
                  </div>
                </div>

                <div className="vc-tool-section">
                  <span className="vc-tool-label">Size:</span>
                  <div className="vc-size-palette">
                    {[2, 5, 10, 20].map((size) => (
                      <button
                        key={size}
                        className={`vc-size-btn ${brushWidth === size ? 'vc-size-btn--active' : ''}`}
                        onClick={() => setBrushWidth(size)}
                      >
                        {size}px
                      </button>
                    ))}
                  </div>
                </div>

                <div className="vc-tool-actions">
                  <button
                    className="vc-action-btn vc-action-btn--clear"
                    onClick={clearCanvas}
                    title="Clear board for everyone"
                  >
                    🗑️ Clear
                  </button>
                  <button
                    className="vc-action-btn vc-action-btn--export"
                    onClick={exportImage}
                    title="Export as PNG"
                  >
                    📥 Export Image
                  </button>
                </div>
              </div>

              <div className="vc-canvas-wrapper">
                <canvas
                  ref={canvasRef}
                  width={1200}
                  height={900}
                  className="vc-canvas"
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleDrawing}
                  onMouseUp={handleStopDraw}
                  onMouseLeave={handleStopDraw}
                  onTouchStart={handleStartDraw}
                  onTouchMove={handleDrawing}
                  onTouchEnd={handleStopDraw}
                />
              </div>
            </div>
          )}

          <div className={`vc-grid ${showWhiteboard ? 'vc-grid--sidebar' : ''}`}>
            {/* Local video tile */}
            <div className="vc-tile vc-tile--local">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`vc-video ${isScreenSharing ? 'vc-video--screen' : ''}`}
              />
              {isVideoOff && <div className="vc-video-off">📷 Camera Off</div>}
              <div className="vc-tile-label">
                {userName || 'You'} (You){isMuted ? ' 🔇' : ''}
                {isScreenSharing ? ' (Sharing)' : ''}
              </div>
            </div>

            {/* Remote peer tiles */}
            {Array.from(peers.values()).map((peer) => (
              <div key={peer.id} className="vc-tile">
                <video
                  autoPlay
                  playsInline
                  className={`vc-video ${peer.isScreenSharing ? 'vc-video--screen' : ''}`}
                  ref={(el) => {
                    if (el && peer.stream) el.srcObject = peer.stream;
                  }}
                />
                {peer.isVideoOff && <div className="vc-video-off">📷 Camera Off</div>}
                <div className="vc-tile-label">
                  {peer.name || 'Peer'}
                  {peer.isMuted ? ' 🔇' : ''}
                  {peer.isScreenSharing ? ' (Sharing)' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vc-controls">
          <button
            className={`vc-ctrl-btn ${isMuted ? 'vc-ctrl-btn--active' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>
          <button
            className={`vc-ctrl-btn ${isVideoOff ? 'vc-ctrl-btn--active' : ''}`}
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? '📷' : '🎥'}
          </button>
          <button
            className={`vc-ctrl-btn ${isScreenSharing ? 'vc-ctrl-btn--active' : ''}`}
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            🖥️
          </button>
          <button
            className={`vc-ctrl-btn ${showWhiteboard ? 'vc-ctrl-btn--active' : ''}`}
            onClick={() => setShowWhiteboard(!showWhiteboard)}
            title={showWhiteboard ? 'Hide Whiteboard' : 'Show Whiteboard'}
            style={{
              borderColor: showWhiteboard ? 'rgba(167, 139, 250, 0.4)' : undefined,
              background: showWhiteboard ? 'rgba(167, 139, 250, 0.15)' : undefined,
            }}
          >
            🎨
          </button>
          <button className="vc-ctrl-btn vc-ctrl-btn--hangup" onClick={hangUp} title="Hang Up">
            📞
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
