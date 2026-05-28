// ─── App-wide constants ────────────────────────────────────────────────────────
export const APP_NAME = 'Debugra';
export const APP_VERSION = '1.0.0';

// ─── Editor Defaults ──────────────────────────────────────────────────────────
export const DEFAULT_LANGUAGE = 'python';
export const DEFAULT_FONT_SIZE = 14;
export const DEFAULT_EDITOR_FONT = 'JetBrains Mono';
export const MIN_FONT_SIZE = 10;
export const MAX_FONT_SIZE = 28;

// ─── Editor Fonts ───────────────────────────────────────────────────────────
export const EDITOR_FONTS = [
  { id: 'JetBrains Mono', label: 'JetBrains Mono' },
  { id: 'Fira Code', label: 'Fira Code' },
  { id: 'Source Code Pro', label: 'Source Code Pro' },
  { id: 'Roboto Mono', label: 'Roboto Mono' },
];

// ─── Editor Themes ────────────────────────────────────────────────────────────
export const DEFAULT_THEME = 'debugra-dark';
export const EDITOR_THEMES = [
  { id: 'debugra-dark', label: 'Debugra Dark' },
  { id: 'vs', label: 'VS Light' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'monokai', label: 'Monokai' },
];

// ─── Output / Panel Widths ────────────────────────────────────────────────────
export const DEFAULT_OUTPUT_WIDTH = 420;
export const MIN_OUTPUT_WIDTH = 260;
export const MAX_OUTPUT_WIDTH = 800;

// ─── Mobile Breakpoint ────────────────────────────────────────────────────────
export const MOBILE_BREAKPOINT = 768;

// ─── Execution Status Types ───────────────────────────────────────────────────
export const EXEC_STATUS = {
  IDLE: { type: 'idle', text: 'Idle' },
  RUNNING: { type: 'running', text: 'Running' },
  SUCCESS: { type: 'success', text: 'Success' },
  ERROR: { type: 'error', text: 'Error' },
  FAILED: { type: 'error', text: 'Failed' },
};

// ─── Language Dot Colors ──────────────────────────────────────────────────────
export const LANG_DOT_CLASS = {
  python: 'dot-py',
  javascript: 'dot-js',
  typescript: 'dot-ts',
  java: 'dot-java',
  cpp: 'dot-cpp',
  c: 'dot-c',
  csharp: 'dot-cs',
  go: 'dot-go',
  rust: 'dot-rust',
  ruby: 'dot-ruby',
  php: 'dot-php',
  swift: 'dot-swift',
};

// ─── Language File Names ──────────────────────────────────────────────────────
export const LANG_FILE_NAMES = {
  python: 'main.py',
  javascript: 'main.js',
  typescript: 'main.ts',
  java: 'Main.java',
  cpp: 'main.cpp',
  c: 'main.c',
  csharp: 'Main.cs',
  go: 'main.go',
  rust: 'main.rs',
  ruby: 'main.rb',
  php: 'main.php',
  swift: 'main.swift',
  perl: 'main.pl',
  lua: 'main.lua',
  scala: 'Main.scala',
  haskell: 'Main.hs',
  sql: 'query.sql',
  bash: 'script.sh',
};

// ─── Language Badge Abbreviations ─────────────────────────────────────────────
export const LANG_BADGES = {
  python: 'PY',
  javascript: 'JS',
  typescript: 'TS',
  java: 'JAVA',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  go: 'GO',
  rust: 'RS',
  ruby: 'RB',
  php: 'PHP',
  swift: 'SW',
  bash: 'SH',
  sql: 'SQL',
};

// ─── Input Detection Patterns ─────────────────────────────────────────────────
export const INPUT_PATTERNS = {
  python: /\binput\s*\(/,
  javascript: /\breadline\b|\bprompt\s*\(|process\.stdin/,
  typescript: /\breadline\b|\bprompt\s*\(|process\.stdin/,
  java: /\bScanner\b|\bBufferedReader\b|\bSystem\.in\b/,
  cpp: /\bcin\b|\bgetline\b|\bscanf\b/,
  c: /\bscanf\b|\bgets\b|\bfgets\b|\bgetchar\b/,
  csharp: /\bConsole\.Read/,
  go: /\bfmt\.Scan|\bbufio\.NewReader|\bos\.Stdin/,
  rust: /\bstdin\b|\bread_line\b/,
  ruby: /\bgets\b|\bSTDIN/,
  php: /\bfgets\s*\(\s*STDIN|\breadline\b|\bfscanf\s*\(\s*STDIN/,
  swift: /\breadLine\b/,
  perl: /\b<STDIN>|\bchomp/,
  lua: /\bio\.read/,
  scala: /\bscala\.io\.StdIn|\breadLine\b/,
  haskell: /\bgetLine\b|\bgetChar\b|\binteract\b/,
  bash: /\bread\b/,
};

// ─── Mobile Tab Keys ──────────────────────────────────────────────────────────
export const MOBILE_TABS = {
  CODE: 'code',
  OUTPUT: 'output',
  CHAT: 'chat',
  SAVED: 'saved',
};

// ─── Output Tab Keys ──────────────────────────────────────────────────────────
export const OUTPUT_TABS = {
  STDOUT: 'stdout',
  STDERR: 'stderr',
  AI: 'ai',
};
