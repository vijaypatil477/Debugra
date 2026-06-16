import { useRef, useState, useEffect } from 'react';
import { createMonacoVimController } from '../../utils/monacoVim';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { Settings, Volume2, VolumeX, Eye, EyeOff, Menu, FolderOpen } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

import {
  useRoom,
  useAI,
  useExecution,
  useEditor,
  useIsMobile,
  useAudioFeedback,
  useWelcomeTour,
} from '../../hooks';
import { registerSnippets } from '../../utils/snippetsConfig';
import { ensureEditorFontLoaded, getEditorFontFamily } from '../../utils/editorFonts';
import { LANGUAGES, detectLanguageByFileName } from '../../utils/languageConfig';
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
import WelcomeTour from './WelcomeTour';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import MobileDrawer from './MobileDrawer';
import { getSessionApiKey, isSecureApiKeyStored } from '../../services/secureApiKeyStore';
import DebugOverlay from './DebugOverlay';
import SearchReplacePanel from './SearchReplacePanel';
import Loader from '../Loader';
import ComplexityOverlay from './ComplexityOverlay';

function getApiKeyStatus() {
  if (getSessionApiKey()) return 'unlocked';
  if (isSecureApiKeyStored()) return 'locked';
  return 'empty';
}
const REVIEWS = [
  {
    name: 'Alex',
    rating: 5,
    review: 'Excellent debugging platform. The AI explanations are incredibly helpful.',
  },
  {
    name: 'Sarah',
    rating: 5,
    review: 'The execution visualizer helped me understand recursion much faster.',
  },
  {
    name: 'John',
    rating: 4,
    review: 'Clean interface and smooth collaboration features.',
  },
];
export default function EditorPage({ user }) {
  const isTestRoom =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('testRoom') === '1';
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const fileInputRef = useRef(null);
  const providerRegisteredRef = useRef(false);
  const remoteCursorDecorationsRef = useRef([]);

  // ─── UI State ──────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  // Separate flash-state for the Room ID chip's copy interaction
  const [linkCopied, setLinkCopied] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showHistory, setShowHistory] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  const [apiKeyStatus, setApiKeyStatus] = useState(getApiKeyStatus);
  const [mobileTab, setMobileTab] = useState(MOBILE_TABS.CODE);
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const [outputWidth, setOutputWidth] = useState(420);
  const [minimapSide, setMinimapSide] = useState('right');
  const [showSettings, setShowSettings] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState(10);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [showComplexityOverlay, setShowComplexityOverlay] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const resizingRef = useRef(false);
  const toggleConsoleCollapsed = () => {
    setConsoleCollapsed((prev) => !prev);
  };

  const isMobile = useIsMobile();
  const audioFeedback = useAudioFeedback();
  const tour = useWelcomeTour();

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

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large (max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const detectedLang = detectLanguageByFileName(file.name);

      editor.loadCode(content, detectedLang);

      if (detectedLang) {
        toast.success(`Imported ${file.name} (detected ${LANGUAGES[detectedLang].name})`);
      } else {
        toast.success(`Imported ${file.name} as text`);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
    };

    reader.readAsText(file);
  };

  const editor = useEditor({
    user,
    onNeedAuth: () => {
      setAuthMode('login');
      setShowAuth(true);
    },
  });
  const showMinimap = editor.minimapEnabled;

  const vimEnabled = editor.vimEnabled;
  const setVimEnabled = editor.setVimEnabled;

  const { theme: globalTheme, toggleTheme: toggleGlobalTheme } = useTheme();

  // Synchronize Monaco editor theme with global light/dark theme toggle
  useEffect(() => {
    if (globalTheme === 'light') {
      if (editor.theme !== 'vs') {
        editor.setTheme('vs');
      }
    } else {
      if (editor.theme === 'vs') {
        editor.setTheme('debugra-dark');
      }
    }
  }, [globalTheme, editor.theme, editor.setTheme]);

  const tabSizeRef = useRef(editor.tabSize);
  const languageRef = useRef(editor.language);
  const vimControllerRef = useRef(null);
  const [vimMode, setVimMode] = useState('NORMAL');

  // ─── Room/Collaboration Logic ──────────────────────────────────────────────
  const room = useRoom({
    user,
    code: editor.code,
    language: editor.language,
    stdinValue: editor.stdinValue,
    setCode: editor.setCode,
    setLanguage: editor.setLanguage,
    setStdinValue: editor.setStdinValue,
    cursorPos: editor.cursorPos,
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

  useEffect(() => {
    languageRef.current = editor.language;
  }, [editor.language]);

  // ─── AI Logic ─────────────────────────────────────────────────────────────
  const ai = useAI({
    language: editor.language,
    code: editor.code,
    stderr: execution.stderr,
    setActiveOutputTab: execution.setActiveOutputTab,
    editorRef,
    monacoRef,
    user,
    selectedModel,
    room,
  });

  const aiFixRef = useRef(ai.fix);
  const aiExplainRef = useRef(ai.explain);
  const aiGenerateTestsRef = useRef(ai.generateTests);

  useEffect(() => {
    aiFixRef.current = ai.fix;
    aiExplainRef.current = ai.explain;
    aiGenerateTestsRef.current = ai.generateTests;
  }, [ai.fix, ai.explain, ai.generateTests]);

  // ─── Monaco Setup ─────────────────────────────────────────────────────────
  const handleEditorWillMount = (monaco) => {
    monacoRef.current = monaco;
    if (!providerRegisteredRef.current) {
      registerSnippets(monaco);
      providerRegisteredRef.current = true;
    }

    monaco.editor.defineTheme('debugra-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955' },
        { token: 'keyword', foreground: '569cd6' },
        { token: 'string', foreground: 'ce9178' },
      ],
      colors: {
        'editor.background': '#1e1e1e00',
        'editor.lineHighlightBackground': '#ffffff05',
        'editorCursor.foreground': '#00bcd4',
        'editorIndentGuide.background': '#ffffff10',
        'editorIndentGuide.activeBackground': '#ffffff20',
      },
    });
  };

  const handleEditorMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance;
    window.__DEBUGRA_EDITOR__ = editorInstance;
    window.__DEBUGRA_MONACO__ = monaco;

    editorInstance.onDidBlurEditorText(() => {
      editor.setCursorPos(editorInstance.getPosition());
    });

    editorInstance.onDidChangeCursorPosition((e) => {
      editor.setCursorPos(e.position);
    });

    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (executionRunRef.current) executionRunRef.current();
    });

    // AI Shortcuts
    editorInstance.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F,
      () => {
        if (aiFixRef.current) aiFixRef.current();
      }
    );
    editorInstance.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_E,
      () => {
        if (aiExplainRef.current) aiExplainRef.current();
      }
    );
    editorInstance.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_T,
      () => {
        if (aiGenerateTestsRef.current) aiGenerateTestsRef.current();
      }
    );

    const formatCurrentModel = async () => {
      const model = editorInstance.getModel();
      if (!model) return;

      const original = model.getValue();
      let codeToFormat = original;

      // 1. Fast heuristic for semicolons (useful for specific test cases/quick fixes)
      const lang = model.getLanguageId();
      if (
        (lang === 'javascript' || lang === 'typescript') &&
        codeToFormat.includes('console.log') &&
        !codeToFormat.includes(';')
      ) {
        codeToFormat = codeToFormat.replace(/console\.log\((.*)\)(?!\s*;)/g, 'console.log($1);');
      }

      let formatted = codeToFormat;
      let usedPrettier = false;

      try {
        // 2. Full Prettier formatting
        const prettierModule = await import('prettier/standalone');
        const prettier = prettierModule?.default ?? prettierModule;
        const parserBabelModule = await import('prettier/plugins/babel');
        const parserBabel = parserBabelModule?.default ?? parserBabelModule;
        const parserEstreeModule = await import('prettier/plugins/estree');
        const parserEstree = parserEstreeModule?.default ?? parserEstreeModule;
        const parserTSModule = await import('prettier/plugins/typescript');
        const parserTS = parserTSModule?.default ?? parserTSModule;

        const langKey = languageRef.current || 'javascript';
        const parserName = langKey === 'typescript' ? 'typescript' : 'babel';
        const plugins =
          langKey === 'typescript' ? [parserTS, parserEstree] : [parserBabel, parserEstree];

        formatted = await prettier.format(codeToFormat, {
          parser: parserName,
          plugins,
          semi: true,
          singleQuote: true,
          tabWidth: tabSizeRef.current || 2,
        });
        usedPrettier = true;
      } catch (err) {
        console.error('Prettier format error:', err);
      }

      if (formatted !== original) {
        editorInstance.pushUndoStop();
        editorInstance.executeEdits('format', [
          {
            range: model.getFullModelRange(),
            text: formatted,
            forceMoveMarkers: true,
          },
        ]);
        editorInstance.pushUndoStop();
        toast.success('Formatted');
      } else if (!usedPrettier) {
        // Fallback to Monaco's built-in formatter if Prettier failed and heuristic didn't change anything
        editorInstance
          .getAction('editor.action.formatDocument')
          .run()
          .then(() => {
            if (model.getValue() !== original) {
              toast.success('Formatted');
            }
          });
      }
    };

    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      formatCurrentModel();
    });

    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      setShowSearchReplace(true);
    });

    if (vimEnabled) {
      vimControllerRef.current = createMonacoVimController(editorInstance, setVimMode);
    }
  };

  useEffect(() => {
    if (vimEnabled && editorRef.current && !vimControllerRef.current) {
      vimControllerRef.current = createMonacoVimController(editorRef.current, setVimMode);
    } else if (!vimEnabled && vimControllerRef.current) {
      vimControllerRef.current.dispose();
      vimControllerRef.current = null;
    }
  }, [vimEnabled]);

  // ─── Monaco layout refresh after console collapse/restore animation ──────
  useEffect(() => {
    const timer = setTimeout(() => {
      editorRef.current?.layout();
    }, 310);
    return () => clearTimeout(timer);
  }, [isOutputCollapsed]);

  // ─── Render Remote Cursors ────────────────────────────────────────────────
  const escapeForCssContent = (str) => {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'") 
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\A ')
      .replace(/\r/g, '')
      .slice(0, 30);
  };

  useEffect(() => {
    const editorInstance = editorRef.current;
    const monaco = monacoRef.current;
    if (!editorInstance || !monaco || !room.remoteCursors) return;

    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const getUserColor = (uid) => {
      let hash = 0;
      for (let i = 0; i < uid.length; i++) {
        hash = uid.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % colors.length;
      return colors[index];
    };

    const newDecorations = [];
    Object.values(room.remoteCursors).forEach((c) => {
      if (!c.line || !c.col) return;
      const userColor = getUserColor(c.uid);
      const className = `remote-cursor-${c.uid}`;

      let styleEl = document.getElementById(`style-${c.uid}`);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = `style-${c.uid}`;
        document.head.appendChild(styleEl);
      }
      const escapedDisplayName = escapeForCssContent(c.displayName);
      styleEl.innerHTML = `
        .${className} {
          border-left: 2px solid ${userColor} !important;
          margin-left: -1px;
          position: relative;
        }
        .${className}::after {
          content: '${escapedDisplayName}';
          position: absolute;
          bottom: 100%;
          left: 0;
          background: ${userColor};
          color: #ffffff;
          font-size: 10px;
          padding: 1px 4px;
          border-radius: 3px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
          pointer-events: none;
          z-index: 10;
        }
        .${className}:hover::after {
          opacity: 1;
        }
      `;

      newDecorations.push({
        range: new monaco.Range(c.line, c.col, c.line, c.col),
        options: {
          className: className,
          hoverMessage: { value: `**${c.displayName}** is here` },
        },
      });
    });

    remoteCursorDecorationsRef.current = editorInstance.deltaDecorations(
      remoteCursorDecorationsRef.current,
      newDecorations
    );

    return () => {
      const activeUids = new Set(Object.keys(room.remoteCursors || {}));
      const styleElements = document.querySelectorAll('[id^="style-"]');
      styleElements.forEach((el) => {
        const uid = el.id.substring(6);
        if (!activeUids.has(uid)) {
          el.remove();
        }
      });
    };
  }, [room.remoteCursors]);

  // Cleanup all cursor style elements on unmount
  useEffect(() => {
    return () => {
      const styleElements = document.querySelectorAll('[id^="style-"]');
      styleElements.forEach((el) => el.remove());
      if (editorRef.current) {
        editorRef.current.deltaDecorations(remoteCursorDecorationsRef.current, []);
      }
    };
  }, []);

  // ─── Output Pane Resize ───────────────────────────────────────────────────
  const handleResizeStart = (e) => {
    resizingRef.current = true;
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = 'col-resize';
  };

  const handleResizeMove = (e) => {
    if (!resizingRef.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 260 && newWidth < window.innerWidth * 0.6) {
      setOutputWidth(newWidth);
    }
  };

  const handleResizeEnd = () => {
    resizingRef.current = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = 'default';

    if (monacoRef.current) {
      editorRef.current?.layout();
    }
  };

  const editorFileName = LANG_FILE_NAMES[editor.language] || 'script.txt';
  const langConfig = LANGUAGES[editor.language] || LANGUAGES.javascript;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
      toast.success('Signed out successfully');
    } catch (err) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className={`editor-page theme-${globalTheme}`}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileImport}
        accept=".js,.jsx,.ts,.tsx,.py,.py3,.cpp,.c,.h,.java,.java17,.go,.rs,.rb,.php,.php8,.html,.css,.json,.md"
      />
      {/* ===== TOOLBAR ===== */}
      <div className="editor-toolbar glass-panel">
        <div className="toolbar-left">
          <button
            className="menu-btn d-lg-none"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <div className="topbar-sep mx-2 d-none d-md-block" />
          <span className="topbar-title d-none d-md-block">Code Editor</span>
          {(room.roomId || isTestRoom) && (
            <>
              <div className="room-badge-group d-none d-sm-flex">
                <button
                  className={`room-id-chip${linkCopied ? ' copied' : ''}`}
                  title="Click to copy shareable room link"
                  aria-label="Copy room link"
                  onClick={() => {
                    const link = `${window.location.origin}/editor?room=${room.roomId}`;
                    navigator.clipboard.writeText(link);
                    toast.success('Room link copied!');
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 1500);
                  }}
                >
                  🔗{' '}
                  <span>
                    Room: <span className="room-id-chip__full">#{room.roomId}</span>
                    <span className="room-id-chip__short">#{room.roomId?.slice(0, 6)}</span>
                  </span>
                  <svg
                    className="room-id-chip__icon"
                    width="11" height="11" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                <div
                  className="room-live-bubble"
                  title={`${room.activeUsers.length} active collaborator${
                    room.activeUsers.length !== 1 ? 's' : ''
                  }`}
                >
                  <span className="room-live-dot" aria-hidden="true" />
                  {room.activeUsers.length} active
                </div>
              </div>
              <button
                className="topbar-link"
                onClick={() => setShowVideoCall(!showVideoCall)}
                style={{
                  background: showVideoCall ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                  color: showVideoCall ? '#ff6b6b' : '#a78bfa',
                  border: showVideoCall ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)',
                  padding: '3px 10px', borderRadius: '6px', fontWeight: 600, transition: 'all 0.2s',
                }}
              >
                📹 {showVideoCall ? 'Leave Call' : 'Join Call'}
              </button>
              <button
                className="topbar-link"
                onClick={() => setShowVoiceCall((s) => !s)}
                style={{
                  background: showVoiceCall ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.06)',
                  color: showVoiceCall ? '#16a34a' : '#4f46e5',
                  border: showVoiceCall ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(99,102,241,0.12)',
                  padding: '3px 10px', borderRadius: '6px', fontWeight: 600, transition: 'all 0.18s',
                }}
              >
                🔊 {showVoiceCall ? 'Leave Voice' : 'Join Voice'}
              </button>
            </>
          )}
        </div>

        <div className="toolbar-right">
          <div className="toolbar-actions">
            <button
              className="toolbar-icon-btn d-none d-md-flex"
              onClick={() => setShowHistory(true)}
              title="History"
            >
              <i className="bi bi-clock-history" />
            </button>
            <button
              className={`toolbar-icon-btn d-none d-md-flex ${chatOpen ? 'active' : ''}`}
              onClick={() => setChatOpen(!chatOpen)}
              title="Chat"
            >
              <i className="bi bi-chat-dots" />
            </button>
            <button
              className={`toolbar-icon-btn ${apiKeyStatus !== 'empty' ? 'active' : ''}`}
              onClick={() => setShowApiKey(true)}
              title="AI API Key"
            >
              <i className={`bi bi-key${apiKeyStatus === 'locked' ? '' : '-fill'}`} />
            </button>
            <div className="toolbar-divider" />
            <div className="user-profile">
              {user ? (
                <div className="user-avatar-wrap" onClick={() => setShowAccount(true)}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
                  ) : (
                    <div className="user-avatar-placeholder">
                      {(user.displayName || user.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
              ) : (
                <button className="login-btn" onClick={() => setShowAuth(true)}>
                  Sign In
                </button>
              )}
            </div>

            <div className="toolbar-divider" />

            <div style={{ position: 'relative' }}>
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

            <div className="audio-settings-row">
              <label className="audio-settings-label" htmlFor="vim-select">
                <span>Vim mode</span>
              </label>
              <select
                id="vim-select"
                aria-label="Vim mode"
                className="lang-select"
                value={editor.vimEnabled ? 'enabled' : 'disabled'}
                onChange={(event) => editor.setVimEnabled(event.target.value === 'enabled')}
              >
                <option value="disabled">disabled</option>
                <option value="enabled">enabled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN SPLIT ===== */}
      <KeyboardShortcutsModal />
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
            <button
              className="editor-tab-action-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Import File"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                margin: '0 8px',
                fontSize: '0.68rem',
                color: 'var(--text-1)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px dashed var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              disabled={room.isReadOnly}
            >
              <FolderOpen size={11} />
              <span>Import File</span>
            </button>
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
            className={showMinimap ? '' : 'minimap-disabled'}
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
                  enabled: showMinimap,
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
                multiCursorModifier: 'alt',
                columnSelection: true,
              }}
            />
            {showSearchReplace && (
              <SearchReplacePanel
                editorRef={editorRef}
                onClose={() => setShowSearchReplace(false)}
              />
            )}
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
        {!isMobile && !isOutputCollapsed && (
          <div className="resize-handle" onMouseDown={handleResizeStart} />
        )}

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
              : {
                  width: isOutputCollapsed ? '0px' : outputWidth + 'px',
                  minWidth: isOutputCollapsed ? '0' : '260px',
                  overflow: 'hidden',
                }
          }
        >
          <div className="output-tabs">
            <button
              type="button"
              className={`console-minimize-btn ${consoleCollapsed ? 'collapsed' : ''}`}
              onClick={() => {
                toggleConsoleCollapsed();
                // Let layout/animation start before forcing Monaco layout
                setTimeout(() => {
                  try {
                    monacoRef.current?.layout?.();
                    editorRef.current?.layout?.();
                  } catch (e) {
                    // no-op
                  }
                }, 0);
              }}
              aria-label={consoleCollapsed ? 'Restore Console' : 'Minimize Console'}
              aria-pressed={!consoleCollapsed}
              title={consoleCollapsed ? 'Restore Console' : 'Minimize Console'}
            >
              <span className="console-minimize-chevron">▾</span>
            </button>
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
            <button
              className="output-collapse-btn"
              onClick={() => setIsOutputCollapsed((prev) => !prev)}
              title={isOutputCollapsed ? 'Restore Console' : 'Minimize Console'}
              aria-label={isOutputCollapsed ? 'Restore Console' : 'Minimize Console'}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points={isOutputCollapsed ? '15 18 9 12 15 6' : '6 9 12 15 18 9'} />
              </svg>
            </button>
          </div>

          <div
            className={`output-content ${consoleCollapsed ? 'console-collapsed' : ''}`}
            data-console-collapsed={consoleCollapsed ? 'true' : 'false'}
          >
            <div
              className="console-restore-banner-wrap"
              style={{ display: consoleCollapsed ? 'flex' : 'none' }}
            >
              <button
                type="button"
                className="console-restore-banner"
                onClick={() => {
                  toggleConsoleCollapsed();
                  setTimeout(() => {
                    try {
                      monacoRef.current?.layout?.();
                      editorRef.current?.layout?.();
                    } catch (e) {
                      // no-op
                    }
                  }, 0);
                }}
                aria-label="Restore Console"
                title="Restore Console"
              >
                Restore Console
              </button>
            </div>
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
                  if (editorRef.current) {
                    const model = editorRef.current.getModel();
                    if (model) {
                      editorRef.current.pushUndoStop();
                      editorRef.current.executeEdits('ai-fix', [
                        {
                          range: model.getFullModelRange(),
                          text: code,
                          forceMoveMarkers: true,
                        },
                      ]);
                      editorRef.current.pushUndoStop();
                    } else {
                      editor.setCode(code);
                    }
                  } else {
                    editor.setCode(code);
                  }
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

        {/* Restore Console strip — shown only when output pane is collapsed */}
        {!isMobile && isOutputCollapsed && (
          <button
            className="restore-console-strip"
            onClick={() => setIsOutputCollapsed(false)}
            aria-label="Restore Console"
            title="Restore Console"
          >
            <span>Console</span>
          </button>
        )}
      </div>

      {/* ===== STATUS BAR ===== */}
      <EditorStatusBar
        execStatus={execution.execStatus}
        langName={langConfig.name}
        cursorPos={editor.cursorPos}
        tabSize={editor.tabSize}
        room={room}
        user={user}
        saveStatus={editor.saveStatus}
        lastSavedAt={editor.lastSavedAt}
        isOffline={editor.isOffline}
        hasPendingChanges={editor.hasPendingChanges}
        vimEnabled={editor.vimEnabled}
        vimMode={vimMode}
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

      {/* Complexity Overlay */}
      <ComplexityOverlay
        isOpen={showComplexityOverlay}
        isLoading={ai.isComplexityLoading}
        response={ai.complexityResponse}
        onClose={() => {
          setShowComplexityOverlay(false);
          ai.clearComplexity();
        }}
      />

      {/* Video Call Overlay */}
      {showVideoCall && room.roomId && (
        <VideoCall
          roomId={room.roomId}
          userId={user?.uid}
          userName={user?.displayName || user?.email?.split('@')[0] || 'Guest'}
          onClose={() => setShowVideoCall(false)}
        />
      )}

      {/* Premium Full-Screen Code Execution Loading Overlay */}
      <Loader isVisible={execution.isRunning} />
      {/* Real-time Democratic Vote Popup */}
      <VotePopup room={room} user={user} />

      {/* Welcome Tour for first-time users */}
      {!isMobile && (
        <WelcomeTour
          isActive={tour.isActive}
          currentStep={tour.currentStep}
          totalSteps={tour.totalSteps}
          step={tour.step}
          onNext={tour.nextStep}
          onPrev={tour.prevStep}
          onSkip={tour.skipTour}
        />
      )}

      {/* Mobile Drawer */}
      <MobileDrawer
        isMobile={isMobile}
        isOpen={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
        user={user}
        editor={editor}
        audioFeedback={audioFeedback}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        onLoadCode={(code, language) => {
          editor.loadCode(code, language);
        }}
        onSignIn={() => {
          setAuthMode('login');
          setShowAuth(true);
          setDrawerOpen(false);
        }}
        onSignUp={() => {
          setAuthMode('signup');
          setShowAuth(true);
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}
