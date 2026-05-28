import { useState, useCallback, useRef, useEffect } from 'react';
import { aiInlineComplete } from '../services/api';
import { LANGUAGES } from '../utils/languageConfig';

/**
 * useInlineCompletion
 * Provides low-latency inline code suggestions as the user types.
 *
 * @param {string} language - current language key
 * @param {string} code - current editor code
 * @param {React.RefObject} editorRef - Monaco editor ref
 */
export function useInlineCompletion({ language, code, editorRef }) {
  const [suggestion, setSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef(null);
  const lastRequestRef = useRef(null);
  const decorationIdsRef = useRef([]);

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
    lastRequestRef.current = null;
  }, []);

  const fetchSuggestion = useCallback(async () => {
    if (!editorRef?.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const position = editor.getPosition();
    if (!position) return;

    const fullCode = model.getValue();
    const cursorOffset = model.getOffsetAt(position);

    const prefix = fullCode.substring(0, cursorOffset);
    const suffix = fullCode.substring(cursorOffset);

    const requestKey = `${language}-${cursorOffset}-${prefix.slice(-300)}-${suffix.slice(0, 100)}`;
    if (lastRequestRef.current === requestKey) {
      return;
    }
    lastRequestRef.current = requestKey;

    setIsLoading(true);
    try {
      const result = await aiInlineComplete(prefix, suffix, LANGUAGES[language].name);
      if (result?.completion) {
        const displayText = result.completion.split('\n')[0].trim();
        setSuggestion({
          text: result.completion,
          displayText,
          line: position.lineNumber,
          column: position.column,
        });
      } else {
        clearSuggestion();
      }
    } catch (err) {
      console.error('Inline completion error:', err);
      clearSuggestion();
    } finally {
      setIsLoading(false);
    }
  }, [language, editorRef, clearSuggestion]);

  const triggerSuggestion = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestion();
    }, 500);
  }, [fetchSuggestion]);

  const acceptSuggestion = useCallback(() => {
    if (!suggestion || !editorRef?.current) return false;

    const editor = editorRef.current;
    const position = editor.getPosition();
    if (!position) return false;

    const range = {
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    };

    editor.executeEdits('inline-complete', [
      {
        range,
        text: suggestion.text,
      },
    ]);

    clearSuggestion();
    return true;
  }, [suggestion, editorRef, clearSuggestion]);

  useEffect(() => {
    if (!editorRef?.current) return;
    clearSuggestion();
  }, [language, clearSuggestion, editorRef]);

  useEffect(() => {
    const editor = editorRef?.current;
    if (!editor) return;

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, []);
  }, [editorRef]);

  useEffect(() => {
    const editor = editorRef?.current;
    if (!editor) return;

    const decorations = suggestion
      ? [
          {
            range: {
              startLineNumber: suggestion.line,
              startColumn: suggestion.column,
              endLineNumber: suggestion.line,
              endColumn: suggestion.column,
            },
            options: {
              after: {
                contentText: suggestion.displayText,
                inlineClassName: 'inline-suggestion-text',
              },
              description: 'inline-suggestion',
            },
          },
        ]
      : [];

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, decorations);
  }, [suggestion, editorRef]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      const editor = editorRef?.current;
      if (editor) {
        editor.deltaDecorations(decorationIdsRef.current, []);
      }
    };
  }, [editorRef]);

  return {
    suggestion,
    isLoading,
    triggerSuggestion,
    acceptSuggestion,
    clearSuggestion,
  };
}
