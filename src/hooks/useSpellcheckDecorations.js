import { useEffect, useMemo, useRef } from 'react';
import { computeSpellcheckDecorations } from '../utils/spellcheckComputeDecorations';

function debounce(fn, waitMs) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
}

/**
 * Adds subtle spellcheck typo decorations to Monaco editor.
 * Scope: words inside comments and string literals.
 */
export function useSpellcheckDecorations({
  editorRef,
  monacoRef,
  code,
  language,
  enabled = true,
}) {
  const decorationIdsRef = useRef([]);
  const latestModelRef = useRef(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const scanDebounced = useMemo(
    () =>
      debounce((model) => {
        const editorInstance = editorRef?.current;
        const monaco = monacoRef?.current;
        if (!editorInstance || !monaco) return;
        if (!enabledRef.current) return;
        if (!model) return;

        // If model changed, avoid applying to old model.
        if (latestModelRef.current !== model) return;

        const monacoRangeCtor = monaco.Range;
        const decorations = computeSpellcheckDecorations({
          code: model.getValue(),
          monacoRangeCtor,
        });

        decorationIdsRef.current = editorInstance.deltaDecorations(
          decorationIdsRef.current,
          decorations
        );
      }, 350),
    [editorRef, monacoRef]
  );

  useEffect(() => {
    const editorInstance = editorRef?.current;
    const monaco = monacoRef?.current;
    if (!editorInstance || !monaco) return;
    if (!enabled) return;

    // Ensure CSS for underline exists.
    const styleId = 'debugra-spellcheck-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        .debugra-spellcheck-typo {
          text-decoration: underline;
          text-decoration-style: wavy;
          text-decoration-color: rgba(248, 113, 113, 0.55) !important;
          text-decoration-thickness: 1px;
        }
      `;
      document.head.appendChild(styleEl);
    }

    const model = editorInstance.getModel();
    if (!model) return;

    latestModelRef.current = model;

    // Initial scan.
    scanDebounced(model);

    const disposable = model.onDidChangeContent(() => {
      latestModelRef.current = model;
      scanDebounced(model);
    });

    return () => {
      try {
        disposable?.dispose?.();
      } catch {
        // no-op
      }
      try {
        editorInstance.deltaDecorations(decorationIdsRef.current, []);
      } catch {
        // no-op
      }
      decorationIdsRef.current = [];
      latestModelRef.current = null;
    };
  }, [editorRef, monacoRef, code, language, enabled, scanDebounced]);
}

