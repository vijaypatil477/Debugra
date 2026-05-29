import toast from 'react-hot-toast';

/**
 * initEmacsKeymap
 * Registers Emacs-style keybindings on a Monaco editor instance dynamically.
 * Returns a cleanup function to dispose of the registered commands and listeners.
 */
export function initEmacsKeymap(editorInstance, monaco, isEnabled, options = {}) {
  if (!editorInstance || !monaco) return null;

  const disposables = [];
  let markActive = false;
  let markPosition = null;
  const killRing = [];

  if (!isEnabled) {
    return null;
  }

  // Helper to show premium styled status toast
  const showToast = (message) => {
    toast(message, {
      id: 'emacs-status',
      icon: '⌨️',
      style: {
        background: '#1e1e2e',
        color: '#cdd6f4',
        border: '1px solid #313244',
      },
    });
  };

  // Helper to handle selection when mark is active
  let isUpdatingSelection = false;
  const cursorListener = editorInstance.onDidChangeCursorPosition(() => {
    if (isUpdatingSelection) return;
    if (markActive && markPosition) {
      const currentPos = editorInstance.getPosition();
      isUpdatingSelection = true;
      editorInstance.setSelection(new monaco.Selection(
        markPosition.lineNumber,
        markPosition.column,
        currentPos.lineNumber,
        currentPos.column
      ));
      isUpdatingSelection = false;
    }
  });
  disposables.push(cursorListener);

  // Toggle mark
  const toggleMark = () => {
    if (markActive) {
      markActive = false;
      markPosition = null;
      showToast('Mark deactivated');
      // Clear selection
      const pos = editorInstance.getPosition();
      editorInstance.setSelection(new monaco.Selection(pos.lineNumber, pos.column, pos.lineNumber, pos.column));
    } else {
      markActive = true;
      markPosition = editorInstance.getPosition();
      showToast('Mark set');
    }
  };

  // Bind command helper
  const addCommand = (keybinding, action) => {
    const disposable = editorInstance.addCommand(keybinding, action);
    if (disposable) disposables.push(disposable);
  };

  // ─── Movements ─────────────────────────────────────────────────────────────
  
  // Ctrl + F -> forward-char
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
    editorInstance.trigger('keyboard', 'cursorRight', null);
  });

  // Ctrl + B -> backward-char
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
    editorInstance.trigger('keyboard', 'cursorLeft', null);
  });

  // Ctrl + P -> previous-line
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
    editorInstance.trigger('keyboard', 'cursorUp', null);
  });

  // Ctrl + N -> next-line
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyN, () => {
    editorInstance.trigger('keyboard', 'cursorDown', null);
  });

  // Ctrl + A -> beginning-of-line
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {
    editorInstance.trigger('keyboard', 'cursorLineStart', null);
  });

  // Ctrl + E -> end-of-line
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
    editorInstance.trigger('keyboard', 'cursorLineEnd', null);
  });

  // Alt + F -> forward-word
  addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
    editorInstance.trigger('keyboard', 'cursorWordRight', null);
  });

  // Alt + B -> backward-word
  addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyB, () => {
    editorInstance.trigger('keyboard', 'cursorWordLeft', null);
  });

  // Alt + < (Alt + Shift + ,) -> beginning-of-buffer
  addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.US_COMMA, () => {
    editorInstance.trigger('keyboard', 'cursorTop', null);
  });

  // Alt + > (Alt + Shift + .) -> end-of-buffer
  addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.US_DOT, () => {
    editorInstance.trigger('keyboard', 'cursorBottom', null);
  });

  // Ctrl + V -> scroll-down
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
    editorInstance.trigger('keyboard', 'cursorPageDown', null);
  });

  // Alt + V -> scroll-up
  addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyV, () => {
    editorInstance.trigger('keyboard', 'cursorPageUp', null);
  });

  // ─── Editing ───────────────────────────────────────────────────────────────

  // Ctrl + D -> delete-char (delete forward)
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
    editorInstance.trigger('keyboard', 'deleteRight', null);
  });

  // Ctrl + H -> delete-backward-char
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
    editorInstance.trigger('keyboard', 'deleteLeft', null);
  });

  // Ctrl + K -> kill-line (cut line to end)
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
    const model = editorInstance.getModel();
    const position = editorInstance.getPosition();
    const lineContent = model.getLineContent(position.lineNumber);

    if (position.column > lineContent.length) {
      if (position.lineNumber < model.getLineCount()) {
        const range = new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber + 1,
          1
        );
        killRing.push('\n');
        editorInstance.executeEdits('emacs-kill-line', [{
          range,
          text: '',
          forceMoveMarkers: true,
        }]);
      }
    } else {
      const range = new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        lineContent.length + 1
      );
      const textToDelete = lineContent.substring(position.column - 1);
      killRing.push(textToDelete);
      editorInstance.executeEdits('emacs-kill-line', [{
        range,
        text: '',
        forceMoveMarkers: true,
      }]);
    }
  });

  // Ctrl + W -> kill-region (cut selected text)
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW, () => {
    const selection = editorInstance.getSelection();
    if (selection && !selection.isEmpty()) {
      const model = editorInstance.getModel();
      const textToDelete = model.getValueInRange(selection);
      killRing.push(textToDelete);
      // Copy to system clipboard
      navigator.clipboard.writeText(textToDelete);
      editorInstance.executeEdits('emacs-kill-region', [{
        range: selection,
        text: '',
        forceMoveMarkers: true,
      }]);
      markActive = false;
      markPosition = null;
      showToast('Killed region');
    } else {
      showToast('No active selection');
    }
  });

  // Alt + W -> kill-ring-save (copy selected text)
  addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyW, () => {
    const selection = editorInstance.getSelection();
    if (selection && !selection.isEmpty()) {
      const model = editorInstance.getModel();
      const textToCopy = model.getValueInRange(selection);
      killRing.push(textToCopy);
      navigator.clipboard.writeText(textToCopy);
      markActive = false;
      markPosition = null;
      // Clear selection
      const pos = editorInstance.getPosition();
      editorInstance.setSelection(new monaco.Selection(pos.lineNumber, pos.column, pos.lineNumber, pos.column));
      showToast('Copied region');
    } else {
      showToast('No active selection');
    }
  });

  // Ctrl + Y -> yank (paste)
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => {
    if (killRing.length > 0) {
      const textToYank = killRing[killRing.length - 1];
      const position = editorInstance.getPosition();
      const range = new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      );
      editorInstance.executeEdits('emacs-yank', [{
        range,
        text: textToYank,
        forceMoveMarkers: true,
      }]);
    } else {
      // Fallback to system clipboard
      navigator.clipboard.readText().then((clipText) => {
        if (clipText) {
          const position = editorInstance.getPosition();
          const range = new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          );
          editorInstance.executeEdits('emacs-yank', [{
            range,
            text: clipText,
            forceMoveMarkers: true,
          }]);
        }
      }).catch(() => {
        showToast('Kill ring is empty');
      });
    }
  });

  // Ctrl + Space -> toggle mark selection mode
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
    toggleMark();
  });

  // Ctrl + / -> undo
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.US_SLASH, () => {
    editorInstance.trigger('keyboard', 'undo', null);
  });

  // Ctrl + _ -> undo
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.US_MINUS, () => {
    editorInstance.trigger('keyboard', 'undo', null);
  });

  // Ctrl + G -> quit selection / clear mark
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
    markActive = false;
    markPosition = null;
    const pos = editorInstance.getPosition();
    editorInstance.setSelection(new monaco.Selection(pos.lineNumber, pos.column, pos.lineNumber, pos.column));
    showToast('Quit');
  });

  // Ctrl + S -> isearch-forward (find widget)
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    editorInstance.trigger('keyboard', 'actions.find', null);
  });

  // Ctrl + R -> isearch-backward (find widget)
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
    editorInstance.trigger('keyboard', 'actions.find', null);
  });

  // Ctrl + O -> open-line (insert newline after cursor, keep position)
  addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyO, () => {
    const pos = editorInstance.getPosition();
    editorInstance.executeEdits('emacs-open-line', [{
      range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
      text: '\n',
    }]);
    editorInstance.setPosition(pos);
  });

  // ─── Chords / Utilities ───────────────────────────────────────────────────

  // Ctrl + X Ctrl + S -> save buffer
  if (monaco.KeyMod.chord) {
    try {
      addCommand(
        monaco.KeyMod.chord(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX,
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS
        ),
        () => {
          if (options.onSave) {
            options.onSave();
          }
        }
      );
    } catch (e) {
      console.warn('Chord binding C-x C-s failed:', e);
    }
  }

  // Return dynamic unbind/cleanup callback
  return () => {
    disposables.forEach((d) => {
      try {
        d.dispose();
      } catch (err) {
        // Silently handle if already disposed
      }
    });
  };
}
