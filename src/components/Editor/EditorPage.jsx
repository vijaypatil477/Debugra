import { useRef, useState, useEffect } from 'react';
import { createMonacoVimController } from '../../utils/monacoVim';
import { createMonacoEmacsController } from '../../utils/monacoEmacs';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { Settings, Volume2, VolumeX, Eye, EyeOff, Menu, FolderOpen, AlertTriangle } from 'lucide-react';

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
import LanguageDropdown from './LanguageDropdown';
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
  // (Hook is created below; used for reset editor confirmation UX)

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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
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
  const vimControllerRef = useRef(null);
  const [vimMode, setVimMode] = useState('NORMAL');
  const emacsControllerRef = useRef(null);
  const [emacsMode, setEmacsMode] = useState('EMACS');

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

  // ─── AI Logic ─────────────────────────────────────────────────────────────
  const ai = useAI({
    language: editor.language,
    code: editor.code,
    stderr: execution.stderr,
    setActiveOutputTab: execution.setActiveOutputTab,
    editorRef,
    model: selectedModel,
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
    if (!window.__MONACO_SNIPPETS_REGISTERED__ && !providerRegisteredRef.current) {
      registerSnippets(monaco);
      window.__MONACO_SNIPPETS_REGISTERED__ = true;
      providerRegisteredRef.current = true;
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

    // Vim initialization is handled in effects; here we only keep non-Vim overrides.
    // Ctrl+S and Tab indentation must remain functional even in Vim mode.

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

    // Prevent our custom Ctrl+S and Tab handlers from being blocked by Vim command-mode.
    // These are handled via the capture-phase DOM keydown listener above, and Vim mode toggling
    // should not override these specific shortcuts.

    // Ctrl+Enter → Run
    editorInstance.addCommand(2048 | 3, () => {
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

    // Initialize Vim controller when enabled (after editorInstance exists).
    if (editor.vimEnabled && !vimControllerRef.current) {
      void createMonacoVimController({
        monaco,
        editor: editorInstance,
        onModeChange: (mode) => {
          // monaco-vim tends to pass strings like 'INSERT', 'NORMAL', 'COMMAND'
          setVimMode(mode);
        },
      }).then((controller) => {
      .catch(err => console.error(err))