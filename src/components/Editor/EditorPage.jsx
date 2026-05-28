import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { Settings, Volume2, VolumeX } from 'lucide-react';

import {
  useRoom,
  useAI,
  useExecution,
  useEditor,
  useIsMobile,
  useAudioFeedback,
} from '../../hooks';
import { registerSnippets } from '../../utils/snippetsConfig';
import { LANGUAGES } from '../../utils/languageConfig';
import { LANG_FILE_NAMES, MOBILE_TABS, OUTPUT_TABS, EDITOR_THEMES } from '../../config/constants';

import AuthModal from '../Auth/AuthModal';
import ChatPanel from '../Chat/ChatPanel';
import FileIcon from '../Icons/FileIcon';
import HistoryPanel from './HistoryPanel';
import AIResponsePanel from './AIResponsePanel';
import ApiKeyModal from './ApiKeyModal';
import CollaborationControls from './CollaborationControls';
import AudioChannel from './AudioChannel';
import EditorStatusBar from './EditorStatusBar';
import MobileBottomNav from './MobileBottomNav';
import VideoCall from './VideoCall';
import VotePopup from './VotePopup';
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
  const [copied, setCopied] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showHistory, setShowHistory] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState(getApiKeyStatus);
  const [mobileTab, setMobileTab] = useState(MOBILE_TABS.CODE);
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [outputWidth, setOutputWidth] = useState(420);
  const [minimapSide, setMinimapSide] = useState('right');
  const [showSettings, setShowSettings] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const resizingRef = useRef(false);

  const isMobile = useIsMobile();
  const audioFeedback = useAudioFeedback();

  // ─── Editor Logic ──────────────────────────────────────────────────────────
  const handleCopyOutput = async () => {
  if (!execution.stdout) return;

      try {
        await navigator.clipboard.writeText(execution.stdout);

        setCopied(true);

        toast.success('Output copied!');

        setTimeout(() => {
          setCopied(false);
        }, 2000);

      } catch (err) {
        toast.error('Failed to copy output');
      }
    };

  const editor = useEditor({
    user,
    onNeedAuth: () => {
      setAuthMode('login');
      setShowAuth(true);
    },
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

  const execution = useExecution({
    language: editor.language,
    code: editor.code,
    stdin: editor.stdinValue,
    isMobile,
    setMobileTab,
    audioFeedback,
    user,
    room,
  });

  const executionRunRef = useRef(execution.run);
  useEffect(() => {
    executionRunRef.current = execution.run;
  }, [execution.run]);

  // ─── AI Logic ─────────────────────────────────────────────────────────────
  const ai = useAI({
    language: editor.language,
    code: editor.code,
    stderr: execution.stderr,
    setActiveOutputTab: execution.setActiveOutputTab,
    editorRef,
  });

  // ─── Monaco Setup ─────────────────────────────────────────────────────────
  const handleEditorWillMount = (monaco) => {
    if (!window.__MONACO_SNIPPETS_REGISTERED__) {
      registerSnippets(monaco);
      window.__MONACO_SNIPPETS_REGISTERED__ = true;
    }

    monaco.editor.defineTheme('debugra-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569cd6' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' },
        { token: 'operator', foreground: 'd4d4d4' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2d2e',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editorIndentGuide.background1': '#3b3b3b',
        'editorIndentGuide.activeBackground1': '#4ec9b0',
        'editorBracketHighlight.foreground1': '#4ec9b0',
        'editorBracketHighlight.foreground2': '#dcdcaa',
        'editorBracketHighlight.foreground3': '#ce9178',
        'editorBracketHighlight.foreground4': '#569cd6',
        'editorBracketHighlight.foreground5': '#c586c0',
        'editorBracketHighlight.foreground6': '#b5cea8',
        'editorBracketMatch.background': '#4ec9b033',
        'editorBracketMatch.border': '#4ec9b0',
      },
    });

    monaco.editor.defineTheme('dracula', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff79c6' },
        { token: 'string', foreground: 'f1fa8c' },
        { token: 'number', foreground: 'bd93f9' },
        { token: 'type', foreground: '8be9fd' },
        { token: 'function', foreground: '50fa7b' },
        { token: 'variable', foreground: 'f8f8f2' },
        { token: 'operator', foreground: 'ff79c6' },
      ],
      colors: {
        'editor.background': '#282a36',
        'editor.foreground': '#f8f8f2',
        'editor.lineHighlightBackground': '#44475a',
        'editor.selectionBackground': '#44475a80',
        'editorCursor.foreground': '#f8f8f2',
        'editorLineNumber.foreground': '#6272a4',
        'editorLineNumber.activeForeground': '#f8f8f2',
        'editorIndentGuide.background1': '#44475a80',
        'editorIndentGuide.activeBackground1': '#8be9fd',
        'editorBracketHighlight.foreground1': '#8be9fd',
        'editorBracketHighlight.foreground2': '#50fa7b',
        'editorBracketHighlight.foreground3': '#f1fa8c',
        'editorBracketHighlight.foreground4': '#ff79c6',
        'editorBracketHighlight.foreground5': '#bd93f9',
        'editorBracketHighlight.foreground6': '#ffb86c',
        'editorBracketMatch.background': '#bd93f933',
        'editorBracketMatch.border': '#bd93f9',
      },
    });

    monaco.editor.defineTheme('monokai', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'f92672' },
        { token: 'string', foreground: 'e6db74' },
        { token: 'number', foreground: 'ae81ff' },
        { token: 'type', foreground: '66d9ef' },
        { token: 'function', foreground: 'a6e22e' },
        { token: 'variable', foreground: 'f8f8f2' },
        { token: 'operator', foreground: 'f92672' },
      ],
      colors: {
        'editor.background': '#272822',
        'editor.foreground': '#f8f8f2',
        'editor.lineHighlightBackground': '#3e3d32',
        'editor.selectionBackground': '#49483e',
        'editorCursor.foreground': '#f8f8f2',
        'editorLineNumber.foreground': '#75715e',
        'editorLineNumber.activeForeground': '#f8f8f2',
        'editorIndentGuide.background1': '#49483e',
        'editorIndentGuide.activeBackground1': '#66d9ef',
        'editorBracketHighlight.foreground1': '#66d9ef',
        'editorBracketHighlight.foreground2': '#a6e22e',
        'editorBracketHighlight.foreground3': '#e6db74',
        'editorBracketHighlight.foreground4': '#f92672',
        'editorBracketHighlight.foreground5': '#ae81ff',
        'editorBracketHighlight.foreground6': '#fd971f',
        'editorBracketMatch.background': '#a6e22e33',
        'editorBracketMatch.border': '#a6e22e',
      },
    });
  };

  const handleEditorMount = (editorInstance) => {
    editorRef.current = editorInstance;
    editorInstance.onDidChangeCursorPosition((e) => {
      editor.setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
    // Ctrl+Enter → Run
    editorInstance.addCommand(2048 | 3, () => {
      if (executionRunRef.current) executionRunRef.current();
    });
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
  const editorFileName = LANG_FILE_NAMES[editor.language] || 'main.txt';

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* ===== TOP BAR ===== */}
      <div className="topbar px-2 px-md-3">
        <div className="topbar-left d-flex align-items-center">
          <button
            onClick={() => navigate('/')}
            className="topbar-logo d-flex align-items-center gap-2"
          >
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
              <button
                className="topbar-link ms-2"
                onClick={() => {
                  navigator.clipboard.writeText(room.roomId);
                  toast.success('Copied!');
                }}
              >
                <span className="d-none d-sm-inline">Copy ID</span>
                <span className="d-inline d-sm-none">ID</span>
              </button>
              <button
                className="topbar-link ms-2"
                onClick={() => setShowVideoCall(!showVideoCall)}
                style={{
                  background: showVideoCall ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                  color: showVideoCall ? '#ff6b6b' : '#a78bfa',
                  border: showVideoCall ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                📹 {showVideoCall ? 'Leave Call' : 'Join Call'}
              </button>
            </>
          )}
        </div>

        <div className="topbar-right d-flex align-items-center gap-2">
          {!room.roomId && (
            <div className="room-controls d-flex align-items-center gap-2">
              <button
                className="topbar-link"
                onClick={async () => {
                  if (!user) {
                    setAuthMode('login');
                    setShowAuth(true);
                    return;
                  }
                  const created = await room.createRoom(roomPassword);
                  if (created) setRoomPassword('');
                }}
              >
                + New Room
              </button>
              <input
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Optional password"
                className="topbar-input topbar-password-input"
                type="password"
              />
              {showJoin ? (
                <>
                  <input
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      room
                        .joinRoom(joinId, joinPassword)
                        .then(
                          (ok) => ok && (setShowJoin(false), setJoinId(''), setJoinPassword(''))
                        )
                    }
                    placeholder="Room ID"
                    className="topbar-input"
                    autoFocus
                  />
                  <input
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      room
                        .joinRoom(joinId, joinPassword)
                        .then(
                          (ok) => ok && (setShowJoin(false), setJoinId(''), setJoinPassword(''))
                        )
                    }
                    placeholder="Passcode"
                    className="topbar-input topbar-password-input"
                    type="password"
                  />
                  <button
                    className="topbar-link"
                    onClick={() =>
                      room
                        .joinRoom(joinId, joinPassword)
                        .then(
                          (ok) => ok && (setShowJoin(false), setJoinId(''), setJoinPassword(''))
                        )
                    }
                  >
                    Join
                  </button>
                  <button className="topbar-link" onClick={() => setShowJoin(false)}>
                    ✕
                  </button>
                </>
              ) : (
                <button
                  className="topbar-link"
                  onClick={() => {
                    if (!user) {
                      setAuthMode('login');
                      setShowAuth(true);
                      return;
                    }
                    setShowJoin(true);
                  }}
                >
                  Join Room
                </button>
              )}
            </div>
          )}
          {user ? (
            <div className="d-flex align-items-center gap-2">
              <button
                className="topbar-link"
                onClick={() => {
                  signOut(auth);
                  toast.success('Logged out');
                }}
              >
                Log Out
              </button>
              <div className="user-avatar">{user.displayName?.[0]?.toUpperCase() || '?'}</div>
              <span
                className="d-none d-md-inline"
                style={{ fontSize: '0.7rem', color: 'var(--text-1)' }}
              >
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <button
                className="topbar-link"
                onClick={() => {
                  setAuthMode('login');
                  setShowAuth(true);
                }}
              >
                Sign In
              </button>
              <button
                className="topbar-link"
                style={{ background: '#8b5cf6', color: 'white', border: 'none' }}
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuth(true);
                }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== TOOLBAR ===== */}
      <div className="toolbar px-2 py-1">
        <div className="toolbar-left d-flex align-items-center gap-2">
          <select
            className="lang-select"
            value={editor.language}
            onChange={(e) => editor.changeLanguage(e.target.value)}
            disabled={room.isReadOnly}
          >
            {Object.entries(LANGUAGES).map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.name}
              </option>
            ))}
          </select>
          <select
            className="lang-select d-none d-sm-block"
            value={editor.theme}
            onChange={(e) => editor.setTheme(e.target.value)}
            aria-label="Editor theme"
          >
            {EDITOR_THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <div className="font-size-ctrl d-none d-sm-flex align-items-center gap-1">
            <button onClick={editor.decreaseFontSize}>−</button>
            <span>{editor.fontSize}px</span>
            <button onClick={editor.increaseFontSize}>+</button>
          </div>
          <div
            className="minimap-side-ctrl d-none d-md-flex align-items-center gap-1"
            aria-label="Minimap position"
          >
            <span>Minimap</span>
            <button
              type="button"
              className={minimapSide === 'left' ? 'active' : ''}
              aria-pressed={minimapSide === 'left'}
              onClick={() => setMinimapSide('left')}
            >
              Left
            </button>
            <button
              type="button"
              className={minimapSide === 'right' ? 'active' : ''}
              aria-pressed={minimapSide === 'right'}
              onClick={() => setMinimapSide('right')}
            >
              Right
            </button>
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
            <button
              className="ai-btn"
              onClick={ai.generateTests}
              disabled={ai.isAILoading || room.isReadOnly}
            >
              Tests
            </button>
            <button className="ai-btn" onClick={ai.audit} disabled={ai.isAILoading}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-5" />
              </svg>
              Audit
            </button>
            <button className="ai-btn" onClick={ai.visualize} disabled={ai.isAILoading}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Visualize
            </button>
            <button className="ai-btn" onClick={ai.explain} disabled={ai.isAILoading}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              Explain
            </button>
          </div>
          <button
            className="ai-btn fix"
            onClick={ai.fix}
            disabled={ai.isAILoading || room.isReadOnly}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            Fix
          </button>
          <div className="d-flex align-items-center gap-1">
            <button
              className="toolbar-icon-btn"
              aria-label="Download Code"
              onClick={editor.downloadCode}
              title="Download"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <button
              className="toolbar-icon-btn"
              aria-label="Save to Cloud"
              onClick={editor.saveToCloud}
              title="Save to cloud"
              disabled={room.isReadOnly}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            </button>
            {user && (
              <button
                className="toolbar-icon-btn"
                aria-label="Toggle History"
                onClick={() => setShowHistory(!showHistory)}
                title="History"
                style={
                  showHistory ? { background: 'var(--bg-active)', color: 'var(--accent)' } : {}
                }
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </button>
            )}
            <div className="audio-settings-wrap">
              <button
                className="toolbar-icon-btn"
                aria-label="Open Settings"
                aria-expanded={showSettings}
                onClick={() => setShowSettings((open) => !open)}
                title="Settings"
                style={
                  showSettings ? { background: 'var(--bg-active)', color: 'var(--accent)' } : {}
                }
              >
                <Settings size={14} />
              </button>
              {showSettings && (
                <div className="audio-settings-popover" role="dialog" aria-label="Settings">
                  <div className="audio-settings-head">
                    <span>Settings</span>
                    <button
                      className="history-action-btn"
                      aria-label="Close Settings"
                      onClick={() => setShowSettings(false)}
                    >
                      <i className="bi bi-x" />
                    </button>
                  </div>
                  <div className="audio-settings-row">
                    <div className="audio-settings-label">
                      <i className="bi bi-palette" style={{ fontSize: '14px' }} />
                      <span>Theme</span>
                    </div>
                    <select
                      className="lang-select"
                      value={editor.theme}
                      onChange={(e) => editor.setTheme(e.target.value)}
                      aria-label="Editor theme"
                      style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                    >
                      {EDITOR_THEMES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="audio-settings-row">
                    <div className="audio-settings-label">
                      {audioFeedback.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      <span>Audio feedback</span>
                    </div>
                    <button
                      className={`audio-toggle ${audioFeedback.muted ? '' : 'active'}`}
                      aria-pressed={!audioFeedback.muted}
                      onClick={() => audioFeedback.setMuted(!audioFeedback.muted)}
                    >
                      {audioFeedback.muted ? 'Muted' : 'On'}
                    </button>
                  </div>
                  <label className="audio-settings-slider">
                    <span>Volume</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={audioFeedback.volume}
                      onChange={(e) => audioFeedback.setVolume(e.target.value)}
                    />
                    <span>{Math.round(audioFeedback.volume * 100)}%</span>
                  </label>
                  <button
                    className="audio-test-btn"
                    onClick={audioFeedback.testSound}
                    disabled={audioFeedback.muted}
                  >
                    Test chime
                  </button>
                </div>
              )}
            </div>
          </div>
          <span className="kbd-hint d-none d-lg-inline">Ctrl+Enter</span>
          <button
            className="clear-btn d-none d-sm-block"
            onClick={() => {
              execution.clear();
              ai.clearAI();
            }}
            disabled={room.isReadOnly}
          >
            Clear
          </button>
          <button
            className="run-btn d-none d-sm-flex align-items-center"
            onClick={execution.run}
            disabled={execution.isRunning}
          >
            {execution.isRunning ? (
              <>
                <span className="spinner" /> Running...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>{' '}
                Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* ===== MAIN SPLIT ===== */}
      <div className="main-split">
        {/* EDITOR PANE */}
        <div
          className="editor-pane"
          style={isMobile && mobileTab !== MOBILE_TABS.CODE ? { display: 'none' } : {}}
        >
          <div className="editor-tab-bar">
            <div className="editor-tab">
              <FileIcon filename={editorFileName} size={17} />
              <span className="editor-tab-name">{editorFileName}</span>
              <button
                className="editor-tab-close"
                type="button"
                aria-label={`Close ${editorFileName}`}
                title="Close tab"
              >
                ×
              </button>
            </div>
            {room.roomId && (
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                <AudioChannel room={room} user={user} />
                <CollaborationControls room={room} user={user} />
              </div>
            )}
          </div>

          {/* Monaco Editor */}
          <div
            id="editor-container"
            style={{ flex: 1, minHeight: 0, opacity: room.isReadOnly ? 0.8 : 1 }}
          >
            {room.isReadOnly && (
              <div className="readonly-badge">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Read Only
              </div>
            )}
            <Editor
              height="100%"
              language={langConfig.monacoLang}
              value={editor.code}
              onChange={(val) => {
                if (!room.isReadOnly) editor.setCode(val || '');
              }}
              beforeMount={handleEditorWillMount}
              onMount={handleEditorMount}
              theme={editor.theme}
              options={{
                readOnly: room.isReadOnly,
                fontSize: editor.fontSize,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: {
                  enabled: true,
                  side: minimapSide,
                  showSlider: 'always',
                  renderCharacters: false,
                },
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
                matchBrackets: 'always',
                renderIndentGuides: true,
                bracketPairColorization: { enabled: true },
                guides: {
                  indentation: true,
                  highlightActiveIndentation: 'always',
                  bracketPairs: true,
                  bracketPairsHorizontal: true,
                  highlightActiveBracketPair: true,
                },
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                formatOnPaste: true,
              }}
            />
          </div>

          {/* Stdin Panel */}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-1)',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => editor.setStdinOpen(!editor.stdinOpen)}
              className="stdin-toggle-btn"
              style={{ color: editor.needsInput ? '#dcdcaa' : 'var(--text-2)' }}
            >
              <div className="d-flex align-items-center gap-2">
                {editor.needsInput && <span className="stdin-pulse-dot" />}
                <span>User Input (stdin)</span>
                {editor.needsInput && (
                  <span style={{ fontSize: '0.62rem', color: '#ce9178' }}>— input detected</span>
                )}
              </div>
              <span
                style={{
                  transition: 'transform 0.2s',
                  transform: editor.stdinOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                ▾
              </span>
            </button>
            {editor.stdinOpen && (
              <div style={{ padding: '0 12px 10px' }}>
                <textarea
                  className="stdin-input"
                  value={editor.stdinValue}
                  onChange={(e) => editor.setStdinValue(e.target.value)}
                  placeholder={
                    editor.needsInput
                      ? 'Type your input here (one value per line)...'
                      : 'Enter input for your program (if needed)...'
                  }
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
          <HistoryPanel
            user={user}
            onLoadCode={editor.loadCode}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* OUTPUT PANE */}
        <div
          className="output-pane"
          style={
            isMobile
              ? mobileTab === MOBILE_TABS.OUTPUT
                ? { display: 'flex', width: '100%' }
                : { display: 'none' }
              : { width: outputWidth + 'px' }
          }
        >
          <div className="output-tabs">
            {/* copy */}
             <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <button
                className={`output-tab ${
                  execution.activeOutputTab === OUTPUT_TABS.STDOUT ? 'active' : ''
                }`}
                onClick={() => execution.setActiveOutputTab(OUTPUT_TABS.STDOUT)}
              >
                Output
              </button>

              {execution.stdout && (
                <button
                  onClick={handleCopyOutput}
                  title="Copy Output"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#aaa',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {copied ? '✓' : '📋'}
                </button>
              )}
             </div>
            {execution.stderr && (
              <button
                className={`output-tab ${execution.activeOutputTab === OUTPUT_TABS.STDERR ? 'active' : ''}`}
                onClick={() => execution.setActiveOutputTab(OUTPUT_TABS.STDERR)}
              >
                <span
                  style={{
                    color: execution.activeOutputTab === OUTPUT_TABS.STDERR ? '#f44747' : undefined,
                  }}
                >
                  ✦ Errors
                </span>
              </button>
            )}
            {(ai.aiResponse || ai.isAILoading) && (
              <button
                className={`output-tab ${execution.activeOutputTab === OUTPUT_TABS.AI ? 'active' : ''}`}
                onClick={() => execution.setActiveOutputTab(OUTPUT_TABS.AI)}
              >
                AI{' '}
                {ai.isAILoading && (
                  <span
                    className="spinner"
                    style={{ width: '8px', height: '8px', borderWidth: '1.5px', marginLeft: '4px' }}
                  />
                )}
              </button>
            )}
          </div>

          <div className="output-content">
            <div
              className={`output-panel ${execution.activeOutputTab === OUTPUT_TABS.STDOUT ? 'active' : ''}`}
              id="output-stdout"
              style={{ position: 'relative' }}
            >
              {execution.stdout ? (
                <>
                  <button
                    className="toolbar-icon-btn"
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--bg-1)', zIndex: 10 }}
                    onClick={() => {
                      navigator.clipboard.writeText(execution.stdout);
                      toast.success('Output copied!');
                    }}
                    title="Copy output"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                  {execution.stdout}
                </>
              ) : (
                <span className="output-placeholder">Run your code to see output here.</span>
              )}
            </div>
            <div
              className={`output-panel ${execution.activeOutputTab === OUTPUT_TABS.STDERR ? 'active' : ''}`}
              id="output-stderr"
            >
              {execution.stderr || <span className="output-placeholder">No errors.</span>}
            </div>
            <div
              className="output-panel"
              style={{
                display: execution.activeOutputTab === OUTPUT_TABS.AI ? 'block' : 'none',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <AIResponsePanel
                isLoading={ai.isAILoading}
                response={ai.aiResponse}
                language={editor.language}
                onApplyFix={(code) => {
                  editor.setCode(code);
                  toast.success('Solution applied!');
                }}
              />
            </div>
          </div>

          {/* Execution info bar */}
          <div className="exec-info">
            <div className="exec-item">
              Status:{' '}
              <span className={`status-badge status-${execution.execStatus.type}`}>
                {execution.execStatus.text}
              </span>
            </div>
            {execution.execTime && (
              <div className="exec-item">
                Time: <strong>{execution.execTime}</strong>
              </div>
            )}
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
          <ChatPanel
            roomId={room.roomId}
            user={user}
            isOpen={true}
            onToggle={() => setMobileTab(MOBILE_TABS.CODE)}
          />
        </div>
      ) : (
        <ChatPanel
          roomId={room.roomId}
          user={user}
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      )}

      {/* History (mobile full-screen) */}
      {isMobile && mobileTab === MOBILE_TABS.SAVED && user && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'var(--bg-0)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-1)',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-0)' }}>
              Code History
            </span>
            <button
              onClick={() => setMobileTab(MOBILE_TABS.CODE)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-1)',
                fontSize: '1.2rem',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <HistoryPanel
              user={user}
              onLoadCode={(c, l) => {
                editor.loadCode(c, l);
                setMobileTab(MOBILE_TABS.CODE);
              }}
              onClose={() => setMobileTab(MOBILE_TABS.CODE)}
            />
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

      {/* Video Call Overlay */}
      {showVideoCall && room.roomId && (
        <VideoCall
          roomId={room.roomId}
          userName={user?.displayName || user?.email?.split('@')[0] || 'Guest'}
          onClose={() => setShowVideoCall(false)}
        />
      )}

      {/* Real-time Democratic Vote Popup */}
      <VotePopup room={room} user={user} />
    </div>
  );
}
