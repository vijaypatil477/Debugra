import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export default function MergeConflictPanel({ conflict, onResolve, language, theme }) {
  const [mergeCode, setMergeCode] = useState(conflict.localCode);
  const [showMergeEditor, setShowMergeEditor] = useState(false);

  useEffect(() => {
    setShowMergeEditor(false);
    setMergeCode(conflict.localCode);
  }, [conflict.remoteCode, conflict.remoteTimestamp]);

  const remoteTime =
    conflict.remoteTimestamp?.toDate?.()?.toLocaleTimeString?.() ||
    new Date(conflict.remoteTimestamp).toLocaleTimeString();

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        background: 'var(--bg-0)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--yellow)' }}>
            ⚠️ Merge Conflict
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
            {conflict.remoteAuthor} edited at {remoteTime}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>
          Auto-resolving in 60s with remote version
        </span>
      </div>

      {!showMergeEditor ? (
        <div style={{ display: 'flex', gap: '12px', flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 0 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 600 }}>
              Your Version
            </span>
            <div
              style={{
                flex: 1,
                border: '1px solid var(--border)',
                borderRadius: '6px',
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              <Editor
                height="100%"
                language={language}
                value={conflict.localCode}
                theme={theme}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 0 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 600 }}>
              Their Version
            </span>
            <div
              style={{
                flex: 1,
                border: '1px solid var(--border)',
                borderRadius: '6px',
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              <Editor
                height="100%"
                language={language}
                value={conflict.remoteCode}
                theme={theme}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 600 }}>
            Edit Merged Result
          </span>
          <div
            style={{
              flex: 1,
              border: '1px solid var(--border)',
              borderRadius: '6px',
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            <Editor
              height="100%"
              language={language}
              value={mergeCode}
              theme={theme}
              onChange={(val) => setMergeCode(val || '')}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          className="topbar-link"
          onClick={() => onResolve('mine')}
          style={{ background: 'var(--bg-2)', color: 'var(--text-1)' }}
        >
          Accept Mine
        </button>
        <button
          className="topbar-link"
          onClick={() => onResolve('theirs')}
          style={{ background: 'var(--bg-2)', color: 'var(--text-1)' }}
        >
          Accept Theirs
        </button>
        {!showMergeEditor ? (
          <button
            className="topbar-link"
            onClick={() => setShowMergeEditor(true)}
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Merge Both
          </button>
        ) : (
          <>
            <button
              className="topbar-link"
              onClick={() => onResolve('merge', mergeCode)}
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Apply Merge
            </button>
            <button
              className="topbar-link"
              onClick={() => setShowMergeEditor(false)}
              style={{ background: 'var(--bg-2)', color: 'var(--text-1)' }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}