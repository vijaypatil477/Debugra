/**
 * Monaco Emacs keymap controller adapter.
 * Provides standard Emacs editing commands, cursor movements, and mark selection mode for Monaco editor.
 */

export function createMonacoEmacsController({ monaco, editor, onModeChange }) {
  if (!editor) {
    return { dispose: () => {} };
  }

  let isMarkSet = false;
  let markPosition = null;

  const updateModeStatus = () => {
    if (onModeChange) {
      onModeChange(isMarkSet ? 'MARK' : 'EMACS');
    }
  };

  updateModeStatus();

  // Helper to move cursor or expand selection if mark is set
  const moveCursorOrExtendSelection = (actionId) => {
    if (!isMarkSet || !markPosition) {
      editor.trigger('emacs', actionId, null);
      return;
    }

    // Execute target movement
    editor.trigger('emacs', actionId, null);
    const newPos = editor.getPosition();
    if (newPos && markPosition) {
      editor.setSelection({
        selectionStartLineNumber: markPosition.lineNumber,
        selectionStartColumn: markPosition.column,
        positionLineNumber: newPos.lineNumber,
        positionColumn: newPos.column,
      });
    }
  };

  // Helper for kill-line (C-k)
  const killLine = () => {
    const position = editor.getPosition();
    const model = editor.getModel();
    if (!position || !model) return;

    const { lineNumber, column } = position;
    const maxColumn = model.getLineMaxColumn(lineNumber);

    if (column === maxColumn) {
      // At end of line: delete newline character to join with next line
      if (lineNumber < model.getLineCount()) {
        const nextLineMaxCol = model.getLineMaxColumn(lineNumber + 1);
        const textToJoin = model.getLineContent(lineNumber + 1);
        const range = {
          startLineNumber: lineNumber,
          startColumn: maxColumn,
          endLineNumber: lineNumber + 1,
          endColumn: nextLineMaxCol,
        };
        editor.executeEdits('emacs-kill-line', [
          {
            range,
            text: textToJoin,
            forceMoveMarkers: true,
          },
        ]);
        // Remove original next line
        const removeRange = {
          startLineNumber: lineNumber + 1,
          startColumn: 1,
          endLineNumber: lineNumber + 1,
          endColumn: nextLineMaxCol,
        };
        editor.executeEdits('emacs-kill-line', [
          {
            range: removeRange,
            text: null,
            forceMoveMarkers: true,
          },
        ]);
      }
    } else {
      // Delete from current column to end of line
      const range = {
        startLineNumber: lineNumber,
        startColumn: column,
        endLineNumber: lineNumber,
        endColumn: maxColumn,
      };
      editor.executeEdits('emacs-kill-line', [
        {
          range,
          text: '',
          forceMoveMarkers: true,
        },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    const browserEvent = e.browserEvent || e;
    const ctrlKey = browserEvent.ctrlKey || browserEvent.metaKey;
    const altKey = browserEvent.altKey;
    const shiftKey = browserEvent.shiftKey;
    const key = (browserEvent.key || '').toLowerCase();
    const code = browserEvent.code || '';

    // --- Ctrl key shortcuts ---
    if (ctrlKey && !altKey) {
      if (key === 'f' || code === 'KeyF') {
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        moveCursorOrExtendSelection('cursorRight');
        return;
      }
      if (key === 'b' || code === 'KeyB') {
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        moveCursorOrExtendSelection('cursorLeft');
        return;
      }
      if (key === 'p' || code === 'KeyP') {
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        moveCursorOrExtendSelection('cursorUp');
        return;
      }
      if (key === 'n' || code === 'KeyN') {
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        moveCursorOrExtendSelection('cursorDown');
        return;
      }
      if (key === 'a' || code === 'KeyA') {
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        moveCursorOrExtendSelection('cursorLineStart');
        return;
      }
      if (key === 'e' || code === 'KeyE') {
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        moveCursorOrExtendSelection('cursorLineEnd');
        return;
      }
      if (key === 'v' || code === 'KeyV') {
        // C-v -> Page down
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        moveCursorOrExtendSelection('cursorPageDown');
        return;
      }
      if (key === 'd' || code === 'KeyD') {
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        editor.trigger('emacs', 'deleteRight', null);
        return;
      }
      if (key === 'k' || code === 'KeyK') {
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        killLine();
        return;
      }
      if (key === 'g' || code === 'KeyG') {
        // C-g -> Cancel mark / clear selection
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        isMarkSet = false;
        markPosition = null;
        updateModeStatus();
        const currentPos = editor.getPosition();
        if (currentPos) {
          editor.setPosition(currentPos);
        }
        return;
      }
      if (key === ' ' || code === 'Space') {
        // C-Space -> Set mark
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        isMarkSet = true;
        markPosition = editor.getPosition();
        updateModeStatus();
        return;
      }
      if (key === '_' || key === '/' || (key === 'z' && !shiftKey)) {
        // C-_ or C-/ -> Undo
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        editor.trigger('emacs', 'undo', null);
        return;
      }
      if (key === 'w' || code === 'KeyW') {
        // C-w -> Kill region (Cut selection)
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        editor.trigger('emacs', 'editor.action.clipboardCutAction', null);
        isMarkSet = false;
        markPosition = null;
        updateModeStatus();
        return;
      }
      if (key === 'y' || code === 'KeyY') {
        // C-y -> Yank (Paste)
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        editor.trigger('emacs', 'editor.action.clipboardPasteAction', null);
        return;
      }
    }

    // --- Alt (Meta) key shortcuts ---
    if (altKey && !ctrlKey) {
      if (key === 'f' || code === 'KeyF') {
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        moveCursorOrExtendSelection('cursorWordRight');
        return;
      }
      if (key === 'b' || code === 'KeyB') {
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        moveCursorOrExtendSelection('cursorWordLeft');
        return;
      }
      if (key === 'v' || code === 'KeyV') {
        // M-v -> Page up
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        moveCursorOrExtendSelection('cursorPageUp');
        return;
      }
      if (key === 'd' || code === 'KeyD') {
        // M-d -> Delete word forward
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        editor.trigger('emacs', 'deleteWordRight', null);
        return;
      }
      if (key === 'backspace' || key === 'delete' || code === 'Backspace') {
        // M-Backspace -> Delete word backward
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        editor.trigger('emacs', 'deleteWordLeft', null);
        return;
      }
      if (key === '<' || key === ',' || (code === 'Comma' && shiftKey)) {
        // M-< -> Top of buffer
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        moveCursorOrExtendSelection('cursorTop');
        return;
      }
      if (key === '>' || key === '.' || (code === 'Period' && shiftKey)) {
        // M-> -> Bottom of buffer
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        moveCursorOrExtendSelection('cursorBottom');
        return;
      }
      if (key === 'w' || code === 'KeyW') {
        // M-w -> Save region (Copy selection)
        browserEvent.preventDefault();
        browserEvent.stopPropagation();
        editor.trigger('emacs', 'editor.action.clipboardCopyAction', null);
        isMarkSet = false;
        markPosition = null;
        updateModeStatus();
        return;
      }
    }
  };

  const listener = editor.onKeyDown(handleKeyDown);

  const dispose = () => {
    try {
      listener.dispose();
    } catch {
      // ignore cleanup errors
    }
  };

  return {
    dispose,
    isMarkActive: () => isMarkSet,
  };
}
