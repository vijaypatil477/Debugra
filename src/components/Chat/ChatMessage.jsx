import React from 'react';

const formatTime = (timestamp) => {
  if (!timestamp?.toDate) return '';
  const d = timestamp.toDate();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatMessage({ msg, isMe, avatarColor, initial }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        marginTop: msg.showHeader ? '10px' : '2px',
      }}
    >
      {msg.showHeader && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '3px',
            padding: '0 2px',
            flexDirection: isMe ? 'row-reverse' : 'row',
          }}
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '4px',
              background: isMe ? '#374151' : avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.5rem',
              fontWeight: 700,
              color: 'white',
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600 }}>
            {isMe ? 'You' : msg.displayName}
          </span>
          <span style={{ fontSize: '0.5rem', color: '#334155' }}>
            {formatTime(msg.createdAt)}
          </span>
        </div>
      )}
      <div
        style={{
          maxWidth: '80%',
          padding: '7px 10px',
          borderRadius: '8px',
          borderTopLeftRadius: !isMe && msg.showHeader ? '2px' : '8px',
          borderTopRightRadius: isMe && msg.showHeader ? '2px' : '8px',
          background: isMe ? '#2d2d2d' : 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: '#cbd5e1',
          fontSize: '0.76rem',
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}
      >
        {msg.text}
      </div>
    </div>
  );
}
