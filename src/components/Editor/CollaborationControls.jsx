import React, { useState } from 'react';
import ParticipantsPanel from './ParticipantsPanel';

/**
 * CollaborationControls
 * Renders the access control bar inside the editor tab bar when a room is active.
 * Handles: participants list panel, role management.
 */
export default function CollaborationControls({ room, user }) {
  const {
    roomData,
    activeUsers,
    isHost,
    isEditor,
    isReadOnly,
    leaveRoom,
  } = room;

  const [showParticipants, setShowParticipants] = useState(false);
  const myRole = roomData?.roles?.[user?.uid] || 'viewer';

  return (
    <div
      style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.7rem',
        overflow: 'visible',
        whiteSpace: 'nowrap',
        maxWidth: '60vw',
        paddingBottom: '2px',
      }}
    >
      {/* Participants button */}
      <button
        onClick={() => setShowParticipants(!showParticipants)}
        style={{
          background: showParticipants ? 'var(--bg-3)' : 'var(--bg-1)',
          color: 'var(--text-1)',
          border: '1px solid var(--border)',
          padding: '2px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Participants ({activeUsers.length})
      </button>

      {showParticipants && (
        <ParticipantsPanel room={room} user={user} onClose={() => setShowParticipants(false)} />
      )}

      {/* Current Role label */}
      <span style={{ color: 'var(--text-2)', marginLeft: '4px' }}>
        Role:{' '}
        <strong style={{ color: isHost ? 'var(--yellow)' : (isEditor ? 'var(--green)' : 'var(--text-1)') }}>
          {myRole.charAt(0).toUpperCase() + myRole.slice(1)}
        </strong>
      </span>

      {/* Exit Room button */}
      <button
        onClick={leaveRoom}
        style={{
          background: '#f44747',
          color: '#fff',
          border: 'none',
          padding: '2px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          flexShrink: 0,
          marginLeft: '4px',
        }}
      >
        Exit
      </button>
    </div>
  );
}
