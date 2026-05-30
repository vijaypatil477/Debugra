import React, { useEffect, useRef } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import { Mic, MicOff, PhoneCall, PhoneOff } from 'lucide-react';

const AudioPeer = ({ stream }) => {
  const audioRef = useRef();

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay />;
};

export default function AudioChannel({ room, user }) {
  const { roomId } = room;
  const { inCall, joinCall, leaveCall, isMuted, toggleMute, peers } = useWebRTC(roomId, user);

  if (!roomId || !user) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
      {peers.map((peer, idx) => (
        <AudioPeer key={idx} stream={peer.stream} />
      ))}

      {!inCall ? (
        <button
          onClick={joinCall}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            padding: '2px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem',
          }}
        >
          <PhoneCall size={12} /> Join Voice
        </button>
      ) : (
        <>
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--green)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span className="stdin-pulse-dot" style={{ background: 'var(--green)' }} />
            Voice ({peers.length + 1})
          </span>
          <button
            onClick={toggleMute}
            style={{
              background: 'var(--bg-3)',
              color: isMuted ? 'var(--red)' : 'var(--text-1)',
              border: '1px solid var(--border)',
              padding: '2px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
            }}
          >
            {isMuted ? <MicOff size={12} /> : <Mic size={12} />}
          </button>
          <button
            onClick={leaveCall}
            style={{
              background: '#f44747',
              color: '#fff',
              border: 'none',
              padding: '2px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
            }}
          >
            <PhoneOff size={12} />
          </button>
        </>
      )}
    </div>
  );
}
