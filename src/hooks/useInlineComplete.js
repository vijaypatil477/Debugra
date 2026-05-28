import { useEffect, useState, useRef } from 'react';
import { aiInlineComplete } from '../services/api';
import { LANGUAGES } from '../utils/languageConfig';

/**
 * useInlineComplete
 * Custom hook to register Monaco's InlineCompletionsProvider.
 * Fetches fill-in-the-middle context and provides ghost-text recommendations.
 *
 * @param {React.RefObject} editorRef - Monaco editor reference
 * @param {React.RefObject} monacoRef - Monaco global reference
 * @param {string} language - current language key (e.g. 'python', 'javascript')
 */
export function useInlineComplete({ editorRef, monacoRef, language, editorMounted }) {
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem('inlineAIEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [isLoading, setIsLoading] = useState(false);
  const providerRef = useRef(null);

  const toggleEnabled = () => {
    setIsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('inlineAIEnabled', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!monacoRef?.current || !editorRef?.current || !isEnabled || !editorMounted) {
      if (providerRef.current) {
        providerRef.current.dispose();
        providerRef.current = null;
      }
      return;
    }

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    if (providerRef.current) {
      providerRef.current.dispose();
      providerRef.current = null;
    }

    const langInfo = LANGUAGES[language];
    const monacoLang = langInfo?.monacoLang || language;

    console.log(`[Inline AI] Registering provider for language: ${monacoLang}`);

    providerRef.current = monaco.languages.registerInlineCompletionsProvider(
      monacoLang,
      {
        provideInlineCompletions: async (model, position, context, token) => {
          if (editor.getModel() !== model) {
            return;
          }

          // Debounce completions requests (500ms delay)
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (token.isCancellationRequested) {
            return;
          }

          const offset = model.getOffsetAt(position);
          const fullText = model.getValue();
          
          const maxPrefixLen = 5000;
          const maxSuffixLen = 2000;
          const prefix = fullText.substring(Math.max(0, offset - maxPrefixLen), offset);
          const suffix = fullText.substring(offset, Math.min(fullText.length, offset + maxSuffixLen));

          // Avoid triggering on purely blank input lines
          if (!prefix.trim()) {
            return;
          }

          try {
            setIsLoading(true);
            const response = await aiInlineComplete(prefix, suffix, langInfo?.name || language);
            
            if (token.isCancellationRequested) {
              return;
            }

            const completionText = response.completion;
            if (!completionText) {
              return;
            }

            return {
              items: [
                {
                  insertText: completionText,
                  range: new monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column
                  ),
                },
              ],
            };
          } catch (err) {
            console.error('[Inline AI] Completion error:', err);
            return;
          } finally {
            setIsLoading(false);
          }
        },
        freeInlineCompletions: () => {}
      }
    );

    return () => {
      if (providerRef.current) {
        providerRef.current.dispose();
        providerRef.current = null;
      }
    };
  }, [monacoRef, editorRef, language, isEnabled, editorMounted]);

  return {
    isEnabled,
    isLoading,
    toggleEnabled,
  };
}
