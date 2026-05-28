/**
 * Centralized Keymaps System
 * 
 * Defines standard keybindings for different editor profiles:
 * - VS Code (default)
 * - Vim
 * - Emacs
 * - Sublime Text
 * - Eclipse
 * 
 * Each profile maps actions to key combinations with support for:
 * - Modifiers: ctrl, shift, alt, cmd
 * - Special keys: Enter, Escape, Tab, etc.
 */

// ─── Action Definitions ───────────────────────────────────────────────────────
export const EDITOR_ACTIONS = {
  // Execution & Run
  RUN_CODE: 'runCode',
  STOP_CODE: 'stopCode',

  // Code Navigation & Selection
  SELECT_LINE: 'selectLine',
  MOVE_UP: 'moveUp',
  MOVE_DOWN: 'moveDown',
  MOVE_LEFT: 'moveLeft',
  MOVE_RIGHT: 'moveRight',
  GO_TO_LINE: 'goToLine',
  GO_TO_END: 'goToEnd',
  GO_TO_START: 'goToStart',

  // Editing
  UNDO: 'undo',
  REDO: 'redo',
  DELETE_LINE: 'deleteLine',
  DUPLICATE_LINE: 'duplicateLine',
  COMMENT_LINE: 'commentLine',
  INDENT: 'indent',
  OUTDENT: 'outdent',

  // Search & Replace
  FIND: 'find',
  FIND_REPLACE: 'findReplace',
  NEXT_MATCH: 'nextMatch',
  PREV_MATCH: 'prevMatch',

  // UI & Navigation
  OPEN_SETTINGS: 'openSettings',
  TOGGLE_SIDEBAR: 'toggleSidebar',
  TOGGLE_OUTPUT: 'toggleOutput',
  OPEN_FILE_EXPLORER: 'openFileExplorer',
};

// ─── Keymap Profiles ──────────────────────────────────────────────────────────
export const KEYMAPS = {
  'vscode': {
    name: 'VS Code (Default)',
    description: 'Default VS Code keybindings',
    bindings: {
      [EDITOR_ACTIONS.RUN_CODE]: { key: 'Enter', ctrl: true }, // Ctrl+Enter
      [EDITOR_ACTIONS.STOP_CODE]: { key: 'Escape' },
      [EDITOR_ACTIONS.SELECT_LINE]: { key: 'l', ctrl: true }, // Ctrl+L
      [EDITOR_ACTIONS.MOVE_UP]: { key: 'ArrowUp' },
      [EDITOR_ACTIONS.MOVE_DOWN]: { key: 'ArrowDown' },
      [EDITOR_ACTIONS.MOVE_LEFT]: { key: 'ArrowLeft' },
      [EDITOR_ACTIONS.MOVE_RIGHT]: { key: 'ArrowRight' },
      [EDITOR_ACTIONS.GO_TO_LINE]: { key: 'g', ctrl: true }, // Ctrl+G
      [EDITOR_ACTIONS.GO_TO_END]: { key: 'End' },
      [EDITOR_ACTIONS.GO_TO_START]: { key: 'Home' },
      [EDITOR_ACTIONS.UNDO]: { key: 'z', ctrl: true }, // Ctrl+Z
      [EDITOR_ACTIONS.REDO]: { key: 'y', ctrl: true }, // Ctrl+Y
      [EDITOR_ACTIONS.DELETE_LINE]: { key: 'k', ctrl: true, shift: true }, // Ctrl+Shift+K
      [EDITOR_ACTIONS.DUPLICATE_LINE]: { key: 'd', ctrl: true, shift: true }, // Ctrl+Shift+D
      [EDITOR_ACTIONS.COMMENT_LINE]: { key: '/', ctrl: true }, // Ctrl+/
      [EDITOR_ACTIONS.INDENT]: { key: 'Tab' },
      [EDITOR_ACTIONS.OUTDENT]: { key: 'Tab', shift: true },
      [EDITOR_ACTIONS.FIND]: { key: 'f', ctrl: true }, // Ctrl+F
      [EDITOR_ACTIONS.FIND_REPLACE]: { key: 'h', ctrl: true }, // Ctrl+H
      [EDITOR_ACTIONS.NEXT_MATCH]: { key: 'Enter' },
      [EDITOR_ACTIONS.PREV_MATCH]: { key: 'Enter', shift: true },
      [EDITOR_ACTIONS.OPEN_SETTINGS]: { key: ',' , ctrl: true }, // Ctrl+,
      [EDITOR_ACTIONS.TOGGLE_SIDEBAR]: { key: 'b', ctrl: true }, // Ctrl+B
      [EDITOR_ACTIONS.TOGGLE_OUTPUT]: { key: '`', ctrl: true }, // Ctrl+`
    },
  },

  'vim': {
    name: 'Vim',
    description: 'Vim-style modal editing',
    bindings: {
      [EDITOR_ACTIONS.RUN_CODE]: { key: 'w', ctrl: true }, // Ctrl+W (write & run)
      [EDITOR_ACTIONS.STOP_CODE]: { key: 'Escape' },
      [EDITOR_ACTIONS.SELECT_LINE]: { key: 'v', shift: true }, // Shift+V (visual line)
      [EDITOR_ACTIONS.MOVE_UP]: { key: 'k' },
      [EDITOR_ACTIONS.MOVE_DOWN]: { key: 'j' },
      [EDITOR_ACTIONS.MOVE_LEFT]: { key: 'h' },
      [EDITOR_ACTIONS.MOVE_RIGHT]: { key: 'l' },
      [EDITOR_ACTIONS.GO_TO_LINE]: { key: 'g', shift: true }, // Shift+G (end of file)
      [EDITOR_ACTIONS.GO_TO_END]: { key: '$' },
      [EDITOR_ACTIONS.GO_TO_START]: { key: '^' },
      [EDITOR_ACTIONS.UNDO]: { key: 'u', ctrl: true }, // Ctrl+U
      [EDITOR_ACTIONS.REDO]: { key: 'r', ctrl: true }, // Ctrl+R
      [EDITOR_ACTIONS.DELETE_LINE]: { key: 'd', shift: true }, // Shift+D
      [EDITOR_ACTIONS.DUPLICATE_LINE]: { key: 'y', shift: true }, // Shift+Y (yank)
      [EDITOR_ACTIONS.COMMENT_LINE]: { key: '#' },
      [EDITOR_ACTIONS.INDENT]: { key: '>' },
      [EDITOR_ACTIONS.OUTDENT]: { key: '<' },
      [EDITOR_ACTIONS.FIND]: { key: '/' },
      [EDITOR_ACTIONS.FIND_REPLACE]: { key: 's', shift: true }, // Shift+S (substitute)
      [EDITOR_ACTIONS.NEXT_MATCH]: { key: 'n' },
      [EDITOR_ACTIONS.PREV_MATCH]: { key: 'n', shift: true },
      [EDITOR_ACTIONS.OPEN_SETTINGS]: { key: ':', shift: true }, // Shift+: (command mode)
      [EDITOR_ACTIONS.TOGGLE_SIDEBAR]: { key: 'e', shift: true }, // Shift+E
      [EDITOR_ACTIONS.TOGGLE_OUTPUT]: { key: 'o', shift: true }, // Shift+O
    },
  },

  'emacs': {
    name: 'Emacs',
    description: 'Emacs-style key chords',
    bindings: {
      [EDITOR_ACTIONS.RUN_CODE]: { key: 'Enter', ctrl: true }, // Ctrl+Enter
      [EDITOR_ACTIONS.STOP_CODE]: { key: 'g', ctrl: true }, // Ctrl+G (abort)
      [EDITOR_ACTIONS.SELECT_LINE]: { key: 'a', ctrl: true }, // Ctrl+A (select all)
      [EDITOR_ACTIONS.MOVE_UP]: { key: 'p', ctrl: true }, // Ctrl+P (previous)
      [EDITOR_ACTIONS.MOVE_DOWN]: { key: 'n', ctrl: true }, // Ctrl+N (next)
      [EDITOR_ACTIONS.MOVE_LEFT]: { key: 'b', ctrl: true }, // Ctrl+B (back)
      [EDITOR_ACTIONS.MOVE_RIGHT]: { key: 'f', ctrl: true }, // Ctrl+F (forward)
      [EDITOR_ACTIONS.GO_TO_LINE]: { key: 'g', alt: true }, // Alt+G
      [EDITOR_ACTIONS.GO_TO_END]: { key: 'e', ctrl: true }, // Ctrl+E (end)
      [EDITOR_ACTIONS.GO_TO_START]: { key: 'a', ctrl: true }, // Ctrl+A (start)
      [EDITOR_ACTIONS.UNDO]: { key: '/', ctrl: true }, // Ctrl+/
      [EDITOR_ACTIONS.REDO]: { key: '_', ctrl: true }, // Ctrl+_ (redo)
      [EDITOR_ACTIONS.DELETE_LINE]: { key: 'k', ctrl: true }, // Ctrl+K (kill line)
      [EDITOR_ACTIONS.DUPLICATE_LINE]: { key: 'w', alt: true }, // Alt+W (copy)
      [EDITOR_ACTIONS.COMMENT_LINE]: { key: ';', alt: true }, // Alt+;
      [EDITOR_ACTIONS.INDENT]: { key: 'm', alt: true }, // Alt+M
      [EDITOR_ACTIONS.OUTDENT]: { key: 'm', alt: true, shift: true }, // Alt+Shift+M
      [EDITOR_ACTIONS.FIND]: { key: 's', ctrl: true }, // Ctrl+S (search)
      [EDITOR_ACTIONS.FIND_REPLACE]: { key: '%', alt: true }, // Alt+%
      [EDITOR_ACTIONS.NEXT_MATCH]: { key: 's', ctrl: true }, // Ctrl+S (again)
      [EDITOR_ACTIONS.PREV_MATCH]: { key: 's', alt: true }, // Alt+S
      [EDITOR_ACTIONS.OPEN_SETTINGS]: { key: 'x', alt: true }, // Alt+X (M-x)
      [EDITOR_ACTIONS.TOGGLE_SIDEBAR]: { key: 'b', alt: true }, // Alt+B
      [EDITOR_ACTIONS.TOGGLE_OUTPUT]: { key: '`', ctrl: true }, // Ctrl+`
    },
  },

  'sublime': {
    name: 'Sublime Text',
    description: 'Sublime Text keybindings',
    bindings: {
      [EDITOR_ACTIONS.RUN_CODE]: { key: 'b', ctrl: true }, // Ctrl+B (build)
      [EDITOR_ACTIONS.STOP_CODE]: { key: 'Escape' },
      [EDITOR_ACTIONS.SELECT_LINE]: { key: 'l', ctrl: true }, // Ctrl+L
      [EDITOR_ACTIONS.MOVE_UP]: { key: 'ArrowUp' },
      [EDITOR_ACTIONS.MOVE_DOWN]: { key: 'ArrowDown' },
      [EDITOR_ACTIONS.MOVE_LEFT]: { key: 'ArrowLeft' },
      [EDITOR_ACTIONS.MOVE_RIGHT]: { key: 'ArrowRight' },
      [EDITOR_ACTIONS.GO_TO_LINE]: { key: 'g', ctrl: true }, // Ctrl+G
      [EDITOR_ACTIONS.GO_TO_END]: { key: 'End' },
      [EDITOR_ACTIONS.GO_TO_START]: { key: 'Home' },
      [EDITOR_ACTIONS.UNDO]: { key: 'z', ctrl: true }, // Ctrl+Z
      [EDITOR_ACTIONS.REDO]: { key: 'z', ctrl: true, shift: true }, // Ctrl+Shift+Z
      [EDITOR_ACTIONS.DELETE_LINE]: { key: 'k', ctrl: true, shift: true }, // Ctrl+Shift+K
      [EDITOR_ACTIONS.DUPLICATE_LINE]: { key: 'd', ctrl: true, shift: true }, // Ctrl+Shift+D
      [EDITOR_ACTIONS.COMMENT_LINE]: { key: '/', ctrl: true }, // Ctrl+/
      [EDITOR_ACTIONS.INDENT]: { key: 'Tab' },
      [EDITOR_ACTIONS.OUTDENT]: { key: 'Tab', shift: true },
      [EDITOR_ACTIONS.FIND]: { key: 'f', ctrl: true }, // Ctrl+F
      [EDITOR_ACTIONS.FIND_REPLACE]: { key: 'h', ctrl: true }, // Ctrl+H
      [EDITOR_ACTIONS.NEXT_MATCH]: { key: 'g', ctrl: true, shift: true }, // Ctrl+Shift+G
      [EDITOR_ACTIONS.PREV_MATCH]: { key: 'g', ctrl: true }, // Ctrl+G
      [EDITOR_ACTIONS.OPEN_SETTINGS]: { key: ',' , ctrl: true }, // Ctrl+,
      [EDITOR_ACTIONS.TOGGLE_SIDEBAR]: { key: 'k', ctrl: true, shift: true }, // Ctrl+Shift+K
      [EDITOR_ACTIONS.TOGGLE_OUTPUT]: { key: '`', ctrl: true }, // Ctrl+`
    },
  },

  'eclipse': {
    name: 'Eclipse',
    description: 'Eclipse IDE keybindings',
    bindings: {
      [EDITOR_ACTIONS.RUN_CODE]: { key: 'F11' },
      [EDITOR_ACTIONS.STOP_CODE]: { key: 'Escape' },
      [EDITOR_ACTIONS.SELECT_LINE]: { key: 'l', alt: true }, // Alt+L
      [EDITOR_ACTIONS.MOVE_UP]: { key: 'ArrowUp', alt: true }, // Alt+Up
      [EDITOR_ACTIONS.MOVE_DOWN]: { key: 'ArrowDown', alt: true }, // Alt+Down
      [EDITOR_ACTIONS.MOVE_LEFT]: { key: 'ArrowLeft' },
      [EDITOR_ACTIONS.MOVE_RIGHT]: { key: 'ArrowRight' },
      [EDITOR_ACTIONS.GO_TO_LINE]: { key: 'l', ctrl: true }, // Ctrl+L
      [EDITOR_ACTIONS.GO_TO_END]: { key: 'End' },
      [EDITOR_ACTIONS.GO_TO_START]: { key: 'Home' },
      [EDITOR_ACTIONS.UNDO]: { key: 'z', ctrl: true }, // Ctrl+Z
      [EDITOR_ACTIONS.REDO]: { key: 'y', ctrl: true }, // Ctrl+Y
      [EDITOR_ACTIONS.DELETE_LINE]: { key: 'd', ctrl: true }, // Ctrl+D
      [EDITOR_ACTIONS.DUPLICATE_LINE]: { key: 'd', ctrl: true, alt: true }, // Ctrl+Alt+D
      [EDITOR_ACTIONS.COMMENT_LINE]: { key: '/', ctrl: true }, // Ctrl+/
      [EDITOR_ACTIONS.INDENT]: { key: 'Tab' },
      [EDITOR_ACTIONS.OUTDENT]: { key: 'Tab', shift: true },
      [EDITOR_ACTIONS.FIND]: { key: 'f', ctrl: true }, // Ctrl+F
      [EDITOR_ACTIONS.FIND_REPLACE]: { key: 'h', ctrl: true }, // Ctrl+H
      [EDITOR_ACTIONS.NEXT_MATCH]: { key: 'k', ctrl: true }, // Ctrl+K
      [EDITOR_ACTIONS.PREV_MATCH]: { key: 'k', ctrl: true, shift: true }, // Ctrl+Shift+K
      [EDITOR_ACTIONS.OPEN_SETTINGS]: { key: ',', alt: true }, // Alt+,
      [EDITOR_ACTIONS.TOGGLE_SIDEBAR]: { key: 'l', ctrl: true, shift: true }, // Ctrl+Shift+L
      [EDITOR_ACTIONS.TOGGLE_OUTPUT]: { key: 'l', alt: true, shift: true }, // Alt+Shift+L
    },
  },
};

export const KEYMAP_PROFILES = Object.keys(KEYMAPS);
export const DEFAULT_KEYMAP = 'vscode';

/**
 * Utility: Convert key binding object to readable string
 * @param {Object} binding - { key, ctrl, shift, alt, cmd }
 * @returns {string} e.g., "Ctrl+Enter", "Shift+J"
 */
export function formatKeyBinding(binding) {
  if (!binding) return '';
  const parts = [];
  if (binding.ctrl) parts.push('Ctrl');
  if (binding.shift) parts.push('Shift');
  if (binding.alt) parts.push('Alt');
  if (binding.cmd) parts.push('Cmd');
  parts.push(binding.key);
  return parts.join('+');
}

/**
 * Utility: Check if a keyboard event matches a binding
 * @param {KeyboardEvent} event
 * @param {Object} binding - { key, ctrl, shift, alt, cmd }
 * @returns {boolean}
 */
export function matchesBinding(event, binding) {
  if (!binding) return false;

  // Check modifiers
  if (binding.ctrl && !event.ctrlKey && !event.metaKey) return false;
  if (binding.shift && !event.shiftKey) return false;
  if (binding.alt && !event.altKey) return false;
  if (binding.cmd && !event.metaKey) return false;

  // Check key (handle special keys + regular keys)
  const eventKey = event.key;
  const bindingKey = binding.key;

  return eventKey === bindingKey || eventKey.toLowerCase() === bindingKey.toLowerCase();
}
