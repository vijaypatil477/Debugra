import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  aiFixCode,
  aiExplainLogic,
  aiVisualizeExecution,
  aiGenerateTests,
  aiAuditCode,
  aiExplainError,
} from '../services/api';
import { showRateLimitToast } from '../utils/rateLimitToast';
import { LANGUAGES } from '../utils/languageConfig';
import { OUTPUT_TABS } from '../config/constants';

/**
 * useAI
 * Encapsulates all Groq AI feature logic: Fix, Explain, Visualize, Tests, Audit.
 *
 * @param {string} language - current language key
 * @param {string} code     - current editor code
 * @param {string} stderr   - last stderr output (for Fix)
 * @param {Function} setActiveOutputTab - to auto-switch to AI tab
 * @param {React.RefObject} editorRef - Monaco editor ref (for selection)
 */
export function useAI({ language, code, stderr, setActiveOutputTab, editorRef , model }) {
  const [aiResponse, setAiResponse] = useState(null);
  const [isAILoading, setIsAILoading] = useState(false);

  // ─── Debug Error (inline button on Errors tab) ─────────────────────────────
  const [debugResponse, setDebugResponse] = useState(null);
  const [isDebugLoading, setIsDebugLoading] = useState(false);

  const withAI = useCallback(
    async (action) => {
      setIsAILoading(true);
      setActiveOutputTab(OUTPUT_TABS.AI);
      try {
        const result = await action();
        setAiResponse(result);
      } catch (err) {
        if (err.status === 429) {
          showRateLimitToast(err.message, err.retryAfter);
        } else {
          toast.error(err.message || 'AI request failed');
        }
      } finally {
        setIsAILoading(false);
      }
    },
    [setActiveOutputTab]
  );

  const fix = useCallback(
    () =>
      withAI(async () => {
        const result = await aiFixCode(code, stderr, LANGUAGES[language].name, model);
        return result;
      }),
    [withAI, code, stderr, language, model]
  );

  const explain = useCallback(
    () =>
      withAI(async () => {
        const sel = editorRef?.current?.getSelection();
        const selectedCode =
          sel && !sel.isEmpty() ? editorRef.current.getModel().getValueInRange(sel) : code;
        return await aiExplainLogic(selectedCode, LANGUAGES[language].name, model);
      }),
    [withAI, code, language, editorRef, model]
  );

  const visualize = useCallback(
    () => withAI(() => aiVisualizeExecution(code, LANGUAGES[language].name, model)),
    [withAI, code, language, model]
  );

  const generateTests = useCallback(
    () => withAI(() => aiGenerateTests(code, LANGUAGES[language].name, model)),
    [withAI, code, language, model]
  );

  const audit = useCallback(
    () => withAI(() => aiAuditCode(code, LANGUAGES[language].name, model)),
    [withAI, code, language, model]
  );

  const clearAI = useCallback(() => setAiResponse(null), []);

  const debugError = useCallback(async () => {
    if (!stderr) return;
    setIsDebugLoading(true);
    setDebugResponse(null);
    try {
      const result = await aiExplainError(code, stderr, LANGUAGES[language].name);
      setDebugResponse(result);
    } catch (err) {
      toast.error(err.message || 'AI debug request failed');
    } finally {
      setIsDebugLoading(false);
    }
  }, [code, stderr, language]);

  const clearDebug = useCallback(() => setDebugResponse(null), []);

  return {
    aiResponse,
    isAILoading,
    fix,
    explain,
    visualize,
    generateTests,
    audit,
    clearAI,
    debugResponse,
    isDebugLoading,
    debugError,
    clearDebug,
  };
}
