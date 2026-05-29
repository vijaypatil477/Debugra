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
import { ensureEditorFontLoaded, getEditorFontFamily } from '../../utils/editorFonts';
import { LANGUAGES } from '../../utils/languageConfig';
import {
  LANG_FILE_NAMES,
  MOBILE_TABS,
  OUTPUT_TABS,
  EDITOR_THEMES,
  EDITOR_FONTS,
} from '../../config/constants';

import AuthModal from '../Auth/AuthModal';
import AccountSettings from '../Auth/AccountSettings';
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
import DebugOverlay from './DebugOverlay';

function getApiKeyStatus() {
  if (getSessionApiKey()) return 'unlocked';
  if (isSecureApiKeyStored()) return 'locked';
  return 'empty';
}

export default function EditorPage({ user }) {
  const isTestRoom =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('testRoom') === '1';
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // ─── UI State ──────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showHistory, setShowHistory] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState(getApiKeyStatus);
  const [mobileTab, setMobileTab] = useState(MOBILE_TABS.CODE);
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [outputWidth, setOutputWidth] = useState(420);
  const [minimapSide, setMinimapSide] = useState('right');
  const [showMinimap, setShowMinimap] = useState(true); // ✅ CHANGE 1: Added showMinimap state
  const [showSettings, setShowSettings] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState(10); //Adds State for wallpaper blur
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
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

  const tabSizeRef = useRef(editor.tabSize);

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

  useEffect(() => {
    ensureEditorFontLoaded(editor.fontFamily);
  }, [editor.fontFamily]);

  useEffect(() => {
    tabSizeRef.current = editor.tabSize;
  }, [editor.tabSize]);

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
    monacoRef.current = monaco;
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
    window.__DEBUGRA_EDITOR__ = editorInstance;
    const monaco = monacoRef.current;
    if (!monaco) return;

    const editorDomNode = editorInstance.getDomNode();
    const handleDomKeyDown = (event) => {
      if (room.isReadOnly) return;

      const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
      if (isSaveShortcut) {
        event.preventDefault();
        event.stopPropagation();
        void formatCurrentModel();
        return;
      }

      if (event.key !== 'Tab') return;

      event.preventDefault();
      event.stopPropagation();

      const spaces = ' '.repeat(tabSizeRef.current);
      const selection = editorInstance.getSelection();

      if (selection) {
        editorInstance.executeEdits('debugra-tab-indent', [
          {
            range: selection,
            text: spaces,
            forceMoveMarkers: true,
          },
        ]);
      }
    };

    editorDomNode?.addEventListener('keydown', handleDomKeyDown, true);
    editorInstance.onDidDispose(() => {
      editorDomNode?.removeEventListener('keydown', handleDomKeyDown, true);
    });

    editorInstance.onDidChangeCursorPosition((e) => {
      editor.setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
    // Ctrl+Enter → Run
    editorInstance.addCommand(2048 | 3, () => {
      if (executionRunRef.current) executionRunRef.current();
    });

    const formatCurrentModel = async () => {
      const model = editorInstance.getModel();
      if (!model) return;

      try {
        const prettierModule = await import('prettier/standalone');
        const prettier = prettierModule?.default ?? prettierModule;
        const parserBabelModule = await import('prettier/plugins/babel');
        const parserBabel = parserBabelModule?.default ?? parserBabelModule;
        const parserEstreeModule = await import('prettier/plugins/estree');
        const parserEstree = parserEstreeModule?.default ?? parserEstreeModule;
        const parserTSModule = await import('prettier/plugins/typescript');
        const parserTS = parserTSModule?.default ?? parserTSModule;

        const langKey = editor.language || 'javascript';
        const parserName = langKey === 'typescript' ? 'typescript' : 'babel';
        const plugins =
          langKey === 'typescript' ? [parserTS, parserEstree] : [parserBabel, parserEstree];

        const original = model.getValue();
        const formatted = await prettier.format(original, {
          parser: parserName,
          plugins,
          semi: true,
          singleQuote: true,
          tabWidth: editor.tabSize || 2,
        });

        model.setValue(formatted);
        editor.setCode(formatted);
        toast.success('Formatted');
        return formatted;
      } catch (err) {
        console.error('Formatting error', err);
        toast.error('Formatting failed');
        return null;
      }
    };

    window.__debugra_formatEditor = formatCurrentModel;

    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
      formatCurrentModel();
    });

    editorInstance.onKeyDown((e) => {
      if (room.isReadOnly) return;
      if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KEY_S) {
        e.preventDefault();
        e.stopPropagation();
        formatCurrentModel();
      }
    });
  };

  useEffect(
    () => () => {
      if (window.__DEBUGRA_EDITOR__ === editorRef.current) {
        window.__DEBUGRA_EDITOR__ = null;
      }
      if (window.__debugra_formatEditor && editorRef.current) {
        window.__debugra_formatEditor = null;
      }
    },
    []
  );

  useEffect(() => {
    if (!editorRef.current) return;

    editorRef.current.updateOptions({
      minimap: {
        enabled: editor.minimapEnabled,
        side: minimapSide,
        showSlider: 'always',
        renderCharacters: false,
      },
      rulers: [{ column: editor.rulerColumn }],
      insertSpaces: true,
      tabSize: editor.tabSize,
    });

    const model = editorRef.current.getModel();
    if (model) {
      model.updateOptions({ tabSize: editor.tabSize, insertSpaces: true });
    }
  }, [editor.tabSize, editor.minimapEnabled, editor.rulerColumn, minimapSide]);

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
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        '--blur-intensity': `${blurIntensity}px`,
      }}
    >
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
          {(room.roomId || isTestRoom) && (
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
                  background: showVideoCall
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(139, 92, 246, 0.15)',
                  color: showVideoCall ? '#ff6b6b' : '#a78bfa',
                  border: showVideoCall
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : '1px solid rgba(139, 92, 246, 0.3)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                📹 {showVideoCall ? 'Leave Call' : 'Join Call'}
              </button>
              <button
                className="topbar-link ms-2"
                onClick={() => setShowVoiceCall((s) => !s)}
                style={{
                  background: showVoiceCall ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.06)',
                  color: showVoiceCall ? '#16a34a' : '#4f46e5',
                  border: showVoiceCall
                    ? '1px solid rgba(16,185,129,0.2)'
                    : '1px solid rgba(99,102,241,0.12)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  transition: 'all 0.18s',
                }}
              >
                🔊 {showVoiceCall ? 'Leave Voice' : 'Join Voice'}
              </button>
            </>
          )}
        </div>

        <div className="topbar-right d-flex align-items-center gap-2">
          {!(room.roomId || isTestRoom) && (
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
              <button
                className="topbar-link"
                onClick={() => setShowAccount(true)}
                title="Account settings"
              >
                Account
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
            {/* ✅ CHANGE 2: Added Show/Hide toggle button for minimap */}
            <button
              type="button"
              className={showMinimap ? 'active' : ''}
              aria-pressed={showMinimap}
              onClick={() => setShowMinimap(!showMinimap)}
              title="Toggle minimap visibility"
            >
              {showMinimap ? 'Hide' : 'Show'}
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

      {showSettings && (
        <div className="settings-modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(event) => event.stopPropagation()}>
            <div className="audio-settings-head">
              <span>Editor Settings</span>
              <button
                className="history-action-btn"
                aria-label="Close Settings"
                onClick={() => setShowSettings(false)}
              >
                <i className="bi bi-x" />
              </button>
            </div>

            <div className="audio-settings-row">
              <label className="audio-settings-label" htmlFor="font-select">
                <span>Editor font</span>
              </label>
              <select
                id="font-select"
                aria-label="Editor font"
                className="lang-select"
                value={editor.fontFamily}
                onChange={(event) => editor.setFontFamily(event.target.value)}
              >
                {EDITOR_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="audio-settings-row">
              <label className="audio-settings-label" htmlFor="tab-size-select">
                <span>Tab size</span>
              </label>
              <select
                id="tab-size-select"
                aria-label="Tab size"
                className="lang-select"
                value={editor.tabSize}
                onChange={(event) => editor.setTabSize(event.target.value)}
              >
                <option value="2">2</option>
                <option value="4">4</option>
              </select>
            </div>

            <div className="audio-settings-row">
              <label className="audio-settings-label" htmlFor="minimap-select">
                <span>Minimap</span>
              </label>
              <select
                id="minimap-select"
                aria-label="Minimap"
                className="lang-select"
                value={editor.minimapEnabled ? 'enabled' : 'disabled'}
                onChange={(event) => editor.setMinimapEnabled(event.target.value === 'enabled')}
              >
                <option value="enabled">enabled</option>
                <option value="disabled">disabled</option>
              </select>
            </div>

            <div className="audio-settings-row">
              <label className="audio-settings-label" htmlFor="ruler-select">
                <span>Vertical ruler</span>
              </label>
              <select
                id="ruler-select"
                aria-label="Vertical ruler"
                className="lang-select"
                value={editor.rulerColumn}
                onChange={(event) => editor.setRulerColumn(event.target.value)}
              >
                <option value="80">80</option>
                <option value="120">120</option>
              </select>
            </div>

            <div className="audio-settings-row">
              <label className="audio-settings-label" htmlFor="autosave-select">
                <span>Autosave interval</span>
              </label>
              <select
                id="autosave-select"
                aria-label="Autosave interval"
                className="lang-select"
                value={editor.autosaveInterval}
                onChange={(event) => editor.setAutosaveInterval(event.target.value)}
              >
                <option value="0">off</option>
                <option value="5000">5000</option>
                <option value="10000">10000</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN SPLIT ===== */}
      <div className="main-split">
        {/* EDITOR PANE */}
        <div
          className="editor-pane glass-panel"
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
            className={editor.minimapEnabled ? '' : 'minimap-disabled'}
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
                fontFamily: getEditorFontFamily(editor.fontFamily),
                minimap: {
                  enabled: showMinimap && editor.minimapEnabled,
                  side: minimapSide,
                  showSlider: 'always',
                  renderCharacters: false,
                },
                detectIndentation: false,
                padding: { top: 12 },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderLineHighlight: room.isReadOnly ? 'none' : 'line',
                automaticLayout: true,
                tabSize: editor.tabSize,
                rulers: [{ column: editor.rulerColumn }],
                insertSpaces: true,
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
          className="output-pane glass-panel"
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <button
                  className={`output-tab ${execution.activeOutputTab === OUTPUT_TABS.STDERR ? 'active' : ''}`}
                  onClick={() => execution.setActiveOutputTab(OUTPUT_TABS.STDERR)}
                >
                  <span
                    style={{
                      color:
                        execution.activeOutputTab === OUTPUT_TABS.STDERR ? '#f44747' : undefined,
                    }}
                  >
                    ✦ Errors
                  </span>
                </button>
                {/* ── Debug with AI inline button ── */}
                <button
                  id="debug-with-ai-btn"
                  className="debug-ai-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    execution.setActiveOutputTab(OUTPUT_TABS.STDERR);
                    ai.debugError();
                    setShowDebugOverlay(true);
                  }}
                  title="Explain this error in plain English"
                  aria-label="Debug with AI"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Debug with AI
                </button>
              </div>
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
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'var(--bg-1)',
                      zIndex: 10,
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText(execution.stdout);
                      toast.success('Output copied!');
                    }}
                    title="Copy output"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
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
        tabSize={editor.tabSize}
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
      {showAuth && <AuthModal initialMode={authMode} onClose={() => setShowAuth(false)} />}
      {showApiKey && (
        <ApiKeyModal
          onClose={() => setShowApiKey(false)}
          onStatusChange={() => setApiKeyStatus(getApiKeyStatus())}
        />
      )}
      {showAccount && user && <AccountSettings onClose={() => setShowAccount(false)} user={user} />}

      {/* Debug Overlay */}
      <DebugOverlay
        isOpen={showDebugOverlay}
        isLoading={ai.isDebugLoading}
        response={ai.debugResponse}
        stderr={execution.stderr}
        onClose={() => {
          setShowDebugOverlay(false);
          ai.clearDebug();
        }}
        onApplyFix={() => {
          ai.fix();
        }}
      />

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
