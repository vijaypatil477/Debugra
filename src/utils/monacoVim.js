// Monacovim integration wrapper.
// This file isolates monaco-vim API differences and supports safe enable/disable.

let monacoVimModulePromise = null;
function loadMonacoVim() {
  if (!monacoVimModulePromise) {
    // monaco-vim is a build-time dependency; keep this import dynamic.
    monacoVimModulePromise = import('monaco-vim');
  }
  return monacoVimModulePromise;
}

/**
 * @param {object} params
 * @param {*} params.monaco - monaco namespace
 * @param {*} params.editor - monaco editor instance
 * @param {(mode: string) => void} params.onModeChange
 */
export async function createMonacoVimController({ monaco, editor, onModeChange }) {
  // Some bundlers/forks expose the initializer directly; keep best-effort extraction.
  const loaded = await loadMonacoVim();
  const monacoVim = loaded?.default ?? loaded;

  // Best-effort: different monaco-vim forks expose different initializer signatures.
  // We attempt the most common patterns.
  let api = null;

  // 1) monacoVim.init/monacoVim.attach
  if (typeof monacoVim?.init === 'function') {
    api = monacoVim.init(editor, monaco);
  } else if (typeof monacoVim?.attach === 'function') {
    api = monacoVim.attach(editor, monaco);
  } else if (typeof monacoVim === 'function') {
    api = monacoVim(editor, monaco);
  } else {
    throw new Error('Unsupported monaco-vim module shape');
  }

  // Best-effort status callback.
  // If library exposes onModeChange/onDidChangeMode, hook it.
  try {
    if (api?.onDidChangeMode && typeof api.onDidChangeMode === 'function') {
      api.onDidChangeMode((mode) => onModeChange?.(mode));
    } else if (api?.onModeChange && typeof api.onModeChange === 'function') {
      api.onModeChange((mode) => onModeChange?.(mode));
    } else if (typeof api?.setModeChangeCallback === 'function') {
      api.setModeChangeCallback((mode) => onModeChange?.(mode));
    }
  } catch {
    // ignore
  }

  // Provide dispose method.
  const dispose = () => {
    try {
      if (api?.dispose && typeof api.dispose === 'function') api.dispose();
      else if (api?.destroy && typeof api.destroy === 'function') api.destroy();
      else if (typeof monacoVim?.dispose === 'function') monacoVim.dispose(editor);
    } catch {
      // ignore
    }
  };

  return {
    dispose,
  };
}
