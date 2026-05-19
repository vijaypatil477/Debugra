import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';

import { useRoom, useAI, useExecution, useEditor, useIsMobile } from '../../hooks';
import { registerSnippets } from '../../utils/snippetsConfig';
import { LANGUAGES } from '../../utils/languageConfig';
import { LANG_DOT_CLASS, LANG_FILE_NAMES, MOBILE_TABS, OUTPUT_TABS } from '../../config/constants';

import AuthModal from '../Auth/AuthModal';
import ChatPanel from '../Chat/ChatPanel';
import HistoryPanel from './HistoryPanel';
import AIResponsePanel from './AIResponsePanel';
import ApiKeyModal from './ApiKeyModal';
import CollaborationControls from './CollaborationControls';
import EditorStatusBar from './EditorStatusBar';
import MobileBottomNav from './MobileBottomNav';
import { getSessionApiKey, isSecureApiKeyStored } from '../../services/secureApiKeyStore';

function getApiKeyStatus() {
  if (getSessionApiKey()) return 'unlocked';
  if (isSecureApiKeyStored()) return 'locked';
  return 'empty';
}

export default function EditorPage({ user }) {
  const navigate = useNavigate();
  const editorRef = useRef(null);

  // ─── UI State ──────────────────────────────────────────────────────────────
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showHistory, setShowHistory] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState(getApiKeyStatus);
  const [mobileTab, setMobileTab] = useState(MOBILE_TABS.CODE);
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [outputWidth, setOutputWidth] = useState(420);
  const resizingRef = useRef(false);

  const isMobile = useIsMobile();

  // ─── Editor Logic ──────────────────────────────────────────────────────────
  const editor = useEditor({
    user,
    onNeedAuth: () => { setAuthMode('login'); setShowAuth(true); },
  });

  // ─── Room/Collaboration Logic ──────────────────────────────────────────────
  const room = useRoom({
    user,
    code: editor.code,
    language: editor.language,
    stdinValue: editor.stdinValue,
    setCode: editor.setCode,
    setLanguage: editor.setLanguage,
    setStdinValue: editor.setStdinValue,
  });

  // ─── Code Execution Logic ──────────────────────────────────────────────────
  const execution = useExecution({
    language: editor.language,
    code: editor.code,
    stdin: editor.stdinValue,
    isMobile,
    setMobileTab,
  });

  // ─── AI Logic ─────────────────────────────────────────────────────────────
  const ai = useAI({
    language: editor.language,
    code: editor.code,
    stderr: execution.stderr,
    setCode: editor.setCode,
    setActiveOutputTab: execution.setActiveOutputTab,
    editorRef,
  });

  // ─── Monaco Setup ─────────────────────────────────────────────────────────
  const handleEditorWillMount = (monaco) => {
    if (!window.__MONACO_SNIPPETS_REGISTERED__) {
      registerSnippets(monaco);
      window.__MONACO_SNIPPETS_REGISTERED__ = true;
    }
  };

  const handleEditorMount = (editorInstance) => {
    editorRef.current = editorInstance;
    editorInstance.onDidChangeCursorPosition((e) => {
      editor.setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
    // Ctrl+Enter → Run
    editorInstance.addCommand(2048 | 3, () => execution.run());
  };

  // ─── Output Pane Resize ───────────────────────────────────────────────────
  const handleResizeStart = (e) => {
    e.preventDefault();
    resizingRef.current = true;
    const startX = e.clientX;
    const startW = outputWidth;
    const onMove = (ev) => {
      if (!resizingRef.current) return;
      setOutputWidth(Math.max(260, Math.min(800, startW + (startX - ev.clientX))));
    };
    const onUp = () => {
      resizingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const langConfig = LANGUAGES[editor.language];

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* ===== TOP BAR ===== */}
      <div className="topbar px-2 px-md-3">
        <div className="topbar-left d-flex align-items-center">
          <button onClick={() => navigate('/')} className="topbar-logo d-flex align-items-center gap-2">
            <img src="/icon-dark.svg" height="20" alt="Debugra Logo" />
            <span className="d-none d-sm-inline">Debugra</span>
          </button>
          <div className="topbar-sep mx-2 d-none d-md-block" />
          <span className="topbar-title d-none d-md-block">Code Editor</span>
          {room.roomId && (
            <>
              <div className="topbar-sep mx-2 d-none d-sm-block" />
              <span className="topbar-title text-success d-none d-sm-inline">
                ✦ Room: {room.roomId}
                <span className="d-none d-lg-inline"> ({room.activeUsers.length} online)</span>
              </span>
              <button className="topbar-link ms-2" onClick={() => { navigator.clipboard.writeText(room.roomId); toast.success('Copied!'); }}>
                <span className="d-none d-sm-inline">Copy ID</span>
                <span className="d-inline d-sm-none">ID</span>
              </button>
            </>
          )}
        </div>

        <div className="topbar-right d-flex align-items-center gap-2">
          {!room.roomId && (
            <div className="room-controls d-flex align-items-center gap-2">
              <button className="topbar-link" onClick={async () => {
                if (!user) { setAuthMode('login'); setShowAuth(true); return; }
                room.createRoom();
              }}>+ New Room</button>
              {showJoin ? (
                <>
                  <input value={joinId} onChange={(e) => setJoinId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && room.joinRoom(joinId).then(ok => ok && (setShowJoin(false), setJoinId('')))}
                    placeholder="Room ID" className="topbar-input" autoFocus />
                  <button className="topbar-link" onClick={() => room.joinRoom(joinId).then(ok => ok && (setShowJoin(false), setJoinId('')))}>Join</button>
                  <button className="topbar-link" onClick={() => setShowJoin(false)}>✕</button>
                </>
              ) : (
                <button className="topbar-link" onClick={() => {
                  if (!user) { setAuthMode('login'); setShowAuth(true); return; }
                  setShowJoin(true);
                }}>Join Room</button>
              )}
            </div>
          )}
          {user ? (
            <div className="d-flex align-items-center gap-2">
              <button className="topbar-link" onClick={() => { signOut(auth); toast.success('Logged out'); }}>Log Out</button>
              <div className="user-avatar">{user.displayName?.[0]?.toUpperCase() || '?'}</div>
              <span className="d-none d-md-inline" style={{ fontSize: '0.7rem', color: 'var(--text-1)' }}>
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <button className="topbar-link" onClick={() => { setAuthMode('login'); setShowAuth(true); }}>Sign In</button>
              <button className="topbar-link" style={{ background: '#8b5cf6', color: 'white', border: 'none' }}
                onClick={() => { setAuthMode('signup'); setShowAuth(true); }}>Sign Up</button>
            </div>
          )}
        </div>
      </div>

      {/* ===== TOOLBAR ===== */}
      <div className="toolbar px-2 py-1">
        <div className="toolbar-left d-flex align-items-center gap-2">
          <select className="lang-select" value={editor.language} onChange={(e) => editor.changeLanguage(e.target.value)} disabled={room.isReadOnly}>
            {Object.entries(LANGUAGES).map(([key, lang]) => (
              <option key={key} value={key}>{lang.name}</option>
            ))}
          </select>
          <div className="font-size-ctrl d-none d-sm-flex align-items-center gap-1">
            <button onClick={editor.decreaseFontSize}>−</button>
            <span>{editor.fontSize}px</span>
            <button onClick={editor.increaseFontSize}>+</button>
          </div>
        </div>
        <div className="toolbar-right d-flex align-items-center gap-2">
          <div className="d-none d-md-flex align-items-center gap-2">
            <button
              className={`ai-btn api-key-toggle ${apiKeyStatus}`}
              onClick={() => setShowApiKey(true)}
              title="Groq API key settings"
            >
              Key
            </button>
            <button className="ai-btn" onClick={ai.generateTests} disabled={ai.isAILoading || room.isReadOnly}>Tests</button>
            <button className="ai-btn" onClick={ai.visualize} disabled={ai.isAILoading}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Visualize
            </button>
            <button className="ai-btn" onClick={ai.explain} disabled={ai.isAILoading}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              Explain
            </button>
          </div>
          <button className="ai-btn fix" onClick={ai.fix} disabled={ai.isAILoading || room.isReadOnly}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            Fix
          </button>
          <div className="d-flex align-items-center gap-1">
            <button className="toolbar-icon-btn" aria-label="Download Code" onClick={editor.downloadCode} title="Download">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button className="toolbar-icon-btn" aria-label="Save to Cloud" onClick={editor.saveToCloud} title="Save to cloud" disabled={room.isReadOnly}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            </button>
            {user && (
              <button className="toolbar-icon-btn" aria-label="Toggle History" onClick={() => setShowHistory(!showHistory)} title="History"
                style={showHistory ? { background: 'var(--bg-active)', color: 'var(--accent)' } : {}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </button>
            )}
          </div>
          <span className="kbd-hint d-none d-lg-inline">Ctrl+Enter</span>
          <button className="clear-btn d-none d-sm-block" onClick={() => { execution.clear(); ai.clearAI(); }} disabled={room.isReadOnly}>Clear</button>
          <button className="run-btn d-none d-sm-flex align-items-center" onClick={execution.run} disabled={execution.isRunning}>
            {execution.isRunning
              ? <><span className="spinner" /> Running...</>
              : <><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run</>
            }
          </button>
        </div>
      </div>

      {/* ===== MAIN SPLIT ===== */}
      <div className="main-split">

        {/* EDITOR PANE */}
        <div className="editor-pane" style={isMobile && mobileTab !== MOBILE_TABS.CODE ? { display: 'none' } : {}}>
          <div className="editor-tab-bar">
            <div className="editor-tab">
              <span className={`dot ${LANG_DOT_CLASS[editor.language] || 'dot-default'}`} />
              <span>{LANG_FILE_NAMES[editor.language] || 'main.txt'}</span>
            </div>
            {room.roomId && (
              <CollaborationControls
                room={room}
                user={user}
              />
            )}
          </div>

          {/* Monaco Editor */}
          <div id="editor-container" style={{ flex: 1, minHeight: 0, opacity: room.isReadOnly ? 0.8 : 1 }}>
            {room.isReadOnly && (
              <div className="readonly-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Read Only
              </div>
            )}
            <Editor
              height="100%"
              language={langConfig.monacoLang}
              value={editor.code}
              onChange={(val) => { if (!room.isReadOnly) editor.setCode(val || ''); }}
              beforeMount={handleEditorWillMount}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                readOnly: room.isReadOnly,
                fontSize: editor.fontSize,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                padding: { top: 12 },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderLineHighlight: room.isReadOnly ? 'none' : 'line',
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                smoothScrolling: true,
                cursorBlinking: room.isReadOnly ? 'solid' : 'smooth',
                cursorSmoothCaretAnimation: 'on',
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true },
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                formatOnPaste: true,
              }}
            />
          </div>

          {/* Stdin Panel */}
          <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-1)', flexShrink: 0 }}>
            <button onClick={() => editor.setStdinOpen(!editor.stdinOpen)} className="stdin-toggle-btn"
              style={{ color: editor.needsInput ? '#dcdcaa' : 'var(--text-2)' }}>
              <div className="d-flex align-items-center gap-2">
                {editor.needsInput && <span className="stdin-pulse-dot" />}
                <span>User Input (stdin)</span>
                {editor.needsInput && <span style={{ fontSize: '0.62rem', color: '#ce9178' }}>— input detected</span>}
              </div>
              <span style={{ transition: 'transform 0.2s', transform: editor.stdinOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
            </button>
            {editor.stdinOpen && (
              <div style={{ padding: '0 12px 10px' }}>
                <textarea className="stdin-input" value={editor.stdinValue} onChange={(e) => editor.setStdinValue(e.target.value)}
                  placeholder={editor.needsInput ? 'Type your input here (one value per line)...' : 'Enter input for your program (if needed)...'}
                />
                {editor.needsInput && !editor.stdinValue.trim() && (
                  <p style={{ fontSize: '0.65rem', color: 'var(--red)', marginTop: '4px' }}>
                    ✦ Your code requires input — enter values above before running
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle (desktop only) */}
        {!isMobile && <div className="resize-handle" onMouseDown={handleResizeStart} />}

        {/* History Panel (desktop) */}
        {showHistory && user && !isMobile && (
          <HistoryPanel user={user} onLoadCode={editor.loadCode} onClose={() => setShowHistory(false)} />
        )}

        {/* OUTPUT PANE */}
        <div className="output-pane"
          style={isMobile
            ? (mobileTab === MOBILE_TABS.OUTPUT ? { display: 'flex', width: '100%' } : { display: 'none' })
            : { width: outputWidth + 'px' }}>
          <div className="output-tabs">
            <button className={`output-tab ${execution.activeOutputTab === OUTPUT_TABS.STDOUT ? 'active' : ''}`}
              onClick={() => execution.setActiveOutputTab(OUTPUT_TABS.STDOUT)}>Output</button>
            {execution.stderr && (
              <button className={`output-tab ${execution.activeOutputTab === OUTPUT_TABS.STDERR ? 'active' : ''}`}
                onClick={() => execution.setActiveOutputTab(OUTPUT_TABS.STDERR)}>
                <span style={{ color: execution.activeOutputTab === OUTPUT_TABS.STDERR ? '#f44747' : undefined }}>✦ Errors</span>
              </button>
            )}
            {(ai.aiResponse || ai.isAILoading) && (
              <button className={`output-tab ${execution.activeOutputTab === OUTPUT_TABS.AI ? 'active' : ''}`}
                onClick={() => execution.setActiveOutputTab(OUTPUT_TABS.AI)}>
                AI {ai.isAILoading && <span className="spinner" style={{ width: '8px', height: '8px', borderWidth: '1.5px', marginLeft: '4px' }} />}
              </button>
            )}
          </div>

          <div className="output-content">
            <div className={`output-panel ${execution.activeOutputTab === OUTPUT_TABS.STDOUT ? 'active' : ''}`} id="output-stdout">
              {execution.stdout || <span className="output-placeholder">Run your code to see output here.</span>}
            </div>
            <div className={`output-panel ${execution.activeOutputTab === OUTPUT_TABS.STDERR ? 'active' : ''}`} id="output-stderr">
              {execution.stderr || <span className="output-placeholder">No errors.</span>}
            </div>
            <div className="output-panel" style={{ display: execution.activeOutputTab === OUTPUT_TABS.AI ? 'block' : 'none', fontFamily: "'Inter', sans-serif" }}>
              <AIResponsePanel isLoading={ai.isAILoading} response={ai.aiResponse} onApplyFix={(code) => { editor.setCode(code); toast.success('Solution applied!'); }} />
            </div>
          </div>

          {/* Execution info bar */}
          <div className="exec-info">
            <div className="exec-item">
              Status: <span className={`status-badge status-${execution.execStatus.type}`}>{execution.execStatus.text}</span>
            </div>
            {execution.execTime && <div className="exec-item">Time: <strong>{execution.execTime}</strong></div>}
          </div>
        </div>
      </div>

      {/* ===== STATUS BAR ===== */}
      <EditorStatusBar
        execStatus={execution.execStatus}
        langName={langConfig.name}
        cursorPos={editor.cursorPos}
        room={room}
        user={user}
      />

      {/* Chat */}
      {isMobile && mobileTab === MOBILE_TABS.CHAT && room.roomId ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <ChatPanel roomId={room.roomId} user={user} isOpen={true} onToggle={() => setMobileTab(MOBILE_TABS.CODE)} />
        </div>
      ) : (
        <ChatPanel roomId={room.roomId} user={user} isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      )}

      {/* History (mobile full-screen) */}
      {isMobile && mobileTab === MOBILE_TABS.SAVED && user && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'var(--bg-0)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-0)' }}>Code History</span>
            <button onClick={() => setMobileTab(MOBILE_TABS.CODE)} style={{ background: 'none', border: 'none', color: 'var(--text-1)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <HistoryPanel user={user} onLoadCode={(c, l) => { editor.loadCode(c, l); setMobileTab(MOBILE_TABS.CODE); }} onClose={() => setMobileTab(MOBILE_TABS.CODE)} />
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <MobileBottomNav
          mobileTab={mobileTab}
          setMobileTab={setMobileTab}
          onRun={execution.run}
          onSave={editor.saveToCloud}
          isRunning={execution.isRunning}
          user={user}
          roomId={room.roomId}
          hasError={!!execution.stderr && execution.execStatus.type === 'error'}
          isReadOnly={room.isReadOnly}
        />
      )}

      {/* Auth Modal */}
      {showAuth && <AuthModal mode={authMode} onClose={() => setShowAuth(false)} />}
      {showApiKey && (
        <ApiKeyModal
          onClose={() => setShowApiKey(false)}
          onStatusChange={() => setApiKeyStatus(getApiKeyStatus())}
        />
      )}
    </div>
  );
}
