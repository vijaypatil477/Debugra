import { LANG_FILE_NAMES } from '../../config/constants';

/**
 * EditorStatusBar
 * Renders the VS Code-style bottom status bar showing:
 * - Error/Success icon count
 * - Current language
 * - Cursor position
 * - Online users count (clickable dropdown)
 * - Wandbox + Debugra labels
 */
export default function EditorStatusBar({ execStatus, langName, cursorPos, room, user }) {
  const { roomId, activeUsers, showOnlineDropdown, setShowOnlineDropdown } = room;

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        {/* Error/Success count */}
        <span title={execStatus.text}>
          {execStatus.type === 'error' ? (
            <>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f44747"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>{' '}
              1
            </>
          ) : execStatus.type === 'success' ? (
            <>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3fb950"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>{' '}
              0
            </>
          ) : (
            <>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>{' '}
              0
            </>
          )}
        </span>
        {/* Language */}
        <span>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M16 3h5v5" />
            <path d="M4 20L21 3" />
            <path d="M21 16v5h-5" />
            <path d="M15 15l6 6" />
            <path d="M4 4l5 5" />
          </svg>
          {langName}
        </span>
        {/* Encoding */}
        <span>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 7V4h16v3" />
            <path d="M9 20h6" />
            <path d="M12 4v16" />
          </svg>
          UTF-8
        </span>
        {/* Cursor */}
        <span>
          Ln {cursorPos.line}, Col {cursorPos.col}
        </span>
        <span>Spaces: 4</span>
      </div>

      <div className="statusbar-right">
        {/* Online users (only in a room) */}
        {roomId && (
          <div style={{ position: 'relative' }}>
            <span
              style={{
                color: '#4ec9b0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onClick={() => setShowOnlineDropdown(!showOnlineDropdown)}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {activeUsers.length} online
            </span>
            {showOnlineDropdown && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  marginBottom: '8px',
                  background: 'var(--bg-1)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '4px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  minWidth: '140px',
                  boxShadow: '0 -4px 12px rgba(0,0,0,0.5)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-2)',
                    padding: '4px 6px',
                    borderBottom: '1px solid var(--border)',
                    marginBottom: '2px',
                  }}
                >
                  Connected Users
                </div>
                {activeUsers.map((u) => (
                  <div
                    key={u.uid}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 6px',
                      fontSize: '0.75rem',
                      color: 'var(--text-0)',
                      borderRadius: '3px',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#4ec9b0',
                      }}
                    />
                    {u.displayName} {u.uid === user?.uid ? '(You)' : ''}
                    {u.activeFile && (
                      <span style={{ color: 'var(--text-2)', fontSize: '0.65rem', marginLeft: 'auto' }}>
                        [{LANG_FILE_NAMES[u.activeFile] || u.activeFile}]
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Backend label */}
        <span>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Wandbox
        </span>
        {/* App label */}
        <span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="rgba(255,255,255,0.8)" />
          </svg>
          Debugra
        </span>
      </div>
    </div>
  );
}
