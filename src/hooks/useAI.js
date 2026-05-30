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
export function useAI({ language, code, stderr, setActiveOutputTab, editorRef, onRecordDiagnostic }) {
  const [aiResponse, setAiResponse] = useState(null);
  const [isAILoading, setIsAILoading] = useState(false);

  // ─── Debug Error (inline button on Errors tab) ─────────────────────────────
  const [debugResponse, setDebugResponse] = useState(null);
  const [isDebugLoading, setIsDebugLoading] = useState(false);

  const withAI = useCallback(
    async (action, featureName = 'AI Request') => {
      setIsAILoading(true);
      setActiveOutputTab(OUTPUT_TABS.AI);
      const startTime = performance.now();
      try {
        const result = await action();
        const endTime = performance.now();
        const latencyMs = endTime - startTime;
        setAiResponse(result);
        if (onRecordDiagnostic) {
          onRecordDiagnostic({
            feature: featureName,
            latencyMs,
            usage: result?.usage || null,
            timestamp: new Date().toISOString(),
          });
        }
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
    [setActiveOutputTab, onRecordDiagnostic]
  );

  const fix = useCallback(
    () =>
      withAI(async () => {
        const result = await aiFixCode(code, stderr, LANGUAGES[language].name);
        return result;
      }, 'Fix Code'),
    [withAI, code, stderr, language]
  );

  const explain = useCallback(
    () =>
      withAI(async () => {
        const sel = editorRef?.current?.getSelection();
        const selectedCode =
          sel && !sel.isEmpty() ? editorRef.current.getModel().getValueInRange(sel) : code;
        return await aiExplainLogic(selectedCode, LANGUAGES[language].name);
      }, 'Explain Logic'),
    [withAI, code, language, editorRef]
  );

  const visualize = useCallback(
    () => withAI(() => aiVisualizeExecution(code, LANGUAGES[language].name), 'Visualize Execution'),
    [withAI, code, language]
  );

  const generateTests = useCallback(
    () => withAI(() => aiGenerateTests(code, LANGUAGES[language].name), 'Generate Tests'),
    [withAI, code, language]
  );

  const audit = useCallback(
    () => withAI(() => aiAuditCode(code, LANGUAGES[language].name), 'Audit Code'),
    [withAI, code, language]
  );

  const clearAI = useCallback(() => setAiResponse(null), []);

  const debugError = useCallback(async () => {
    if (!stderr) return;
    setIsDebugLoading(true);
    setDebugResponse(null);
    const startTime = performance.now();
    try {
      const result = await aiExplainError(code, stderr, LANGUAGES[language].name);
      const endTime = performance.now();
      const latencyMs = endTime - startTime;
      setDebugResponse(result);
      if (onRecordDiagnostic) {
        onRecordDiagnostic({
          feature: 'Debug Error',
          latencyMs,
          usage: result?.usage || null,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      toast.error(err.message || 'AI debug request failed');
    } finally {
      setIsDebugLoading(false);
    }
  }, [code, stderr, language, onRecordDiagnostic]);

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
