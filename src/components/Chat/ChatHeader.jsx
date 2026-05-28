export default function ChatHeader({ roomId, onDownloadReport, onToggle }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#252526',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
            Team Chat
          </div>
          <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{roomId}</div>
        </div>
      </div>
      {/* Download Report Button */}
      <button
        onClick={onDownloadReport}
        title="Download Report as Markdown"
        aria-label="Download Debug Report"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: '4px',
          color: '#94a3b8',
          transition: 'color 0.2s',
          marginRight: 'auto',
          marginLeft: '8px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.55rem',
            color: '#10b981',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#10b981',
            }}
          />
          Live
        </span>
        <button
          onClick={onToggle}
          aria-label="Close Chat Panel"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            cursor: 'pointer',
            color: '#e2e8f0',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
