/**
 * Minimal Emacs keybinding adapter for Monaco.
 *
 * Goal (for acceptance criteria): ensure basic Emacs movement commands work
 * cleanly in the text area.
 */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getCursorFromEditor(editorInstance) {
  const pos = editorInstance.getPosition?.();
  if (!pos) return { lineNumber: 1, column: 1 };
  return { lineNumber: pos.lineNumber, column: pos.column };
}

function moveCursor(editorInstance, { lineDelta = 0, columnDelta = 0 }) {

  const model = editorInstance.getModel?.();
  if (!model) return;

  const cur = getCursorFromEditor(editorInstance);
  const maxLine = model.getLineCount();
  const targetLine = clamp(cur.lineNumber + lineDelta, 1, maxLine);

  const lineText = model.getLineContent(targetLine);
  const maxCol = Math.max(1, lineText.length + 1); // Monaco columns are 1-based, allow EOL
  const targetColumn = clamp(cur.column + columnDelta, 1, maxCol);

  editorInstance.setPosition?.({ lineNumber: targetLine, column: targetColumn });

  // Only scroll when the cursor is outside the visible viewport.
  // This avoids unnecessary re-centering while still ensuring the cursor is visible.
  if (
    typeof editorInstance.revealPositionInCenterIfOutsideViewport === 'function'
  ) {
    editorInstance.revealPositionInCenterIfOutsideViewport({
      lineNumber: targetLine,
      column: targetColumn,
    });
  } else {
    editorInstance.revealPositionInCenter?.({
      lineNumber: targetLine,
      column: targetColumn,
    });
  }
}


/**
 * @param {object} params
 * @param {*} params.monaco - monaco namespace
 * @param {*} params.editor - monaco editor instance
 * @param {(mode: string) => void} [params.onModeChange]
 */
export async function createMonacoEmacsController({ editor, onModeChange }) {
  const editorDomNode = editor.getDomNode?.();

  if (!editorDomNode) {
    throw new Error('Emacs controller: editor DOM node not found');
  }

  // const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);


  const isCtrlCmd = (event) => {
    // Emacs typically uses Ctrl keys. On macOS, users might expect Cmd as well,
    // but acceptance criteria specifies Ctrl+F/B/P.
    // Exclude Ctrl+Shift+<key> so Monaco shortcuts like Ctrl+Shift+F still work.
    return event.ctrlKey && !event.shiftKey;
  };


  const handler = (event) => {
    if (!isCtrlCmd(event)) return;

    // prevent Monaco from handling these as default browser/editor behaviors
    // (and prevent bubbling to our app).
    const key = event.key?.toLowerCase?.();
    if (!key) return;

    // Ignore if user is selecting text with modifiers other than Ctrl.
    // (This is conservative; Emacs users often accept selection movement.)
    // Keep minimal: just handle keys we care about.

    if (key === 'f') {
      event.preventDefault();
      event.stopPropagation();
      moveCursor(editor, { columnDelta: 1 });
      return;
    }

    if (key === 'b') {
      event.preventDefault();
      event.stopPropagation();
      moveCursor(editor, { columnDelta: -1 });
      return;
    }

    if (key === 'p') {
      event.preventDefault();
      event.stopPropagation();
      moveCursor(editor, { lineDelta: -1 });
      return;
    }

    // Allow other Ctrl+<key> combos.
  };

  editorDomNode.addEventListener('keydown', handler, true);

  // Provide best-effort mode callback.
  try {
    onModeChange?.('EMACS');
  } catch {
    // ignore
  }

  const dispose = () => {
    try {
      editorDomNode.removeEventListener('keydown', handler, true);
    } catch {
      // ignore
    }
  };

  return { dispose };
}

