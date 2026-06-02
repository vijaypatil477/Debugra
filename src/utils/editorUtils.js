/**
 * editorUtils
 *
 * Utilities to extract selected editor content (Monaco) or full code.
 *
 * Note:
 * - This app stores the latest Monaco editor instance on `window.__DEBUGRA_EDITOR__`
 *   (see EditorPage.jsx). `useAI` calls `getSelectedOrFullCode()` without args,
 *   so this helper relies on that global as a fallback.
 */

function getEditorInstanceFromGlobal() {
  if (typeof window === 'undefined') return null;
  return window.__DEBUGRA_EDITOR__ || null;
}

/**
 * Returns either:
 *  - the currently selected editor text (if user has an active selection), or
 *  - the full editor content as a fallback.
 */
export function getSelectedOrFullCode() {
  const editor = getEditorInstanceFromGlobal();
  if (!editor) return '';

  const model = editor.getModel?.();
  const fullCode = typeof model?.getValue === 'function' ? model.getValue() : '';

  const selection = editor.getSelection?.();
  if (!selection) return fullCode;

  // Monaco selection: starts at (lineNumber, column) and ends at (lineNumber, column)
  const { startLineNumber, startColumn, endLineNumber, endColumn } = selection;

  // If selection is empty (no-op), return full code.
  const isEmptySelection = startLineNumber === endLineNumber && startColumn === endColumn;

  if (isEmptySelection) return fullCode;

  // If model doesn't exist, fallback to full code.
  if (!model || typeof editor.getModel?.getValue !== 'function') return fullCode;

  try {
    return model.getValueInRange
      ? model.getValueInRange(selection)
      : model.getValue().slice(
          // Worst-case fallback: cannot easily compute offsets without more Monaco APIs.
          // Return full code in that case.
          0
        ) || fullCode;
  } catch (e) {
    return fullCode;
  }
}
