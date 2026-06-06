import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { aiStreamRequest } from '../services/api';
import { showRateLimitToast } from '../utils/rateLimitToast';
import { LANGUAGES } from '../utils/languageConfig';
import { OUTPUT_TABS } from '../config/constants';

function parsePartialJSON(jsonStr) {
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    const obj = {};

    // Match "key": "value" string properties (including escaped characters)
    const matches = jsonStr.matchAll(/"([^"]+)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g);
    for (const match of matches) {
      const key = match[1];
      let val = match[2];
      try {
        val = JSON.parse(`"${val}"`);
      } catch (e) {
        // ignore invalid JSON parsing of partial values
      }
      obj[key] = val;
    }

    // Match string arrays (e.g. "steps": [...], "remediationSteps": [...])
    const arrayMatches = jsonStr.matchAll(/"([^"]+)"\s*:\s*\[([\s\S]*?)\]/g);
    for (const match of arrayMatches) {
      const key = match[1];
      const arrayContent = match[2];
      const items = [];
      const itemMatches = arrayContent.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g);
      for (const itemMatch of itemMatches) {
        let val = itemMatch[1];
        try {
          val = JSON.parse(`"${val}"`);
        } catch (e) {
          // ignore
        }
        items.push(val);
      }
      obj[key] = items;
    }

    // Match testCases array of objects
    const testCasesMatch = jsonStr.match(/"testCases"\s*:\s*\[([\s\S]*?)\]/);
    if (testCasesMatch) {
      const testCasesContent = testCasesMatch[1];
      const objMatches = testCasesContent.matchAll(/\{([\s\S]*?)\}/g);
      const testCases = [];
      for (const objMatch of objMatches) {
        const itemContent = objMatch[1];
        const itemObj = {};
        const fieldMatches = itemContent.matchAll(/"([^"]+)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g);
        for (const fm of fieldMatches) {
          const k = fm[1];
          let v = fm[2];
          try {
            v = JSON.parse(`"${v}"`);
          } catch (e) {
            // ignore
          }
          itemObj[k] = v;
        }
        if (Object.keys(itemObj).length > 0) {
          testCases.push(itemObj);
        }
      }
      if (testCases.length > 0) {
        obj.testCases = testCases;
      }
    }

    // Match findings array of objects
    const findingsMatch = jsonStr.match(/"findings"\s*:\s*\[([\s\S]*?)\]/);
    if (findingsMatch) {
      const findingsContent = findingsMatch[1];
      const objMatches = findingsContent.matchAll(/\{([\s\S]*?)\}/g);
      const findings = [];
      for (const objMatch of objMatches) {
        const itemContent = objMatch[1];
        const itemObj = {};
        const fieldMatches = itemContent.matchAll(/"([^"]+)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g);
        for (const fm of fieldMatches) {
          const k = fm[1];
          let v = fm[2];
          try {
            v = JSON.parse(`"${v}"`);
          } catch (e) {
            // ignore
          }
          itemObj[k] = v;
        }
        const numMatches = itemContent.matchAll(/"([^"]+)"\s*:\s*(\d+)/g);
        for (const nm of numMatches) {
          itemObj[nm[1]] = parseInt(nm[2], 10);
        }
        if (Object.keys(itemObj).length > 0) {
          findings.push(itemObj);
        }
      }
      if (findings.length > 0) {
        obj.findings = findings;
      }
    }

    // Match nested complexity objects
    const timeCompMatch = jsonStr.match(/"timeComplexity"\s*:\s*\{([\s\S]*?)\}/);
    if (timeCompMatch) {
      const content = timeCompMatch[1];
      const itemObj = {};
      const fieldMatches = content.matchAll(/"([^"]+)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g);
      for (const fm of fieldMatches) {
        const k = fm[1];
        let v = fm[2];
        try {
          v = JSON.parse(`"${v}"`);
        } catch (e) {
          // ignore
        }
        itemObj[k] = v;
      }
      obj.timeComplexity = itemObj;
    }

    const spaceCompMatch = jsonStr.match(/"spaceComplexity"\s*:\s*\{([\s\S]*?)\}/);
    if (spaceCompMatch) {
      const content = spaceCompMatch[1];
      const itemObj = {};
      const fieldMatches = content.matchAll(/"([^"]+)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g);
      for (const fm of fieldMatches) {
        const k = fm[1];
        let v = fm[2];
        try {
          v = JSON.parse(`"${v}"`);
        } catch (e) {
          // ignore
        }
        itemObj[k] = v;
      }
      obj.spaceComplexity = itemObj;
    }

    // Handle trailing partial string property
    const partialMatch = jsonStr.match(/"([^"]+)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)$/);
    if (partialMatch) {
      const key = partialMatch[1];
      let val = partialMatch[2];
      val = val.replace(/\\$/, '');
      obj[key] = val;
    }

    return obj;
  }
}

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
export function useAI({ language, code, stderr, setActiveOutputTab, editorRef, model }) {
  const [aiResponse, setAiResponse] = useState(null);
  const [isAILoading, setIsAILoading] = useState(false);

  // ─── Debug Error (inline button on Errors tab) ─────────────────────────────────────────────
  const [debugResponse, setDebugResponse] = useState(null);
  const [isDebugLoading, setIsDebugLoading] = useState(false);

  // ─── Complexity Analysis ───────────────────────────────────────────────────────────
  const [complexityResponse, setComplexityResponse] = useState(null);
  const [isComplexityLoading, setIsComplexityLoading] = useState(false);

  const streamAI = useCallback(async (url, body, setResponseState, setLoadingState) => {
    setLoadingState(true);
    setResponseState(null);
    let accumulated = '';
    try {
      await aiStreamRequest(url, body, (chunk) => {
        accumulated += chunk;
        const isJson = accumulated.trim().startsWith('{');
        if (isJson) {
          try {
            const parsed = parsePartialJSON(accumulated);
            setResponseState(parsed);
          } catch (e) {
            // Ignore partial json parse errors during streaming
          }
        } else {
          // Code Fix
          let cleanCode = accumulated;
          const thinkStart = cleanCode.indexOf('<think>');
          if (thinkStart !== -1) {
            const thinkEnd = cleanCode.indexOf('</think>');
            if (thinkEnd !== -1) {
              cleanCode = cleanCode.substring(0, thinkStart) + cleanCode.substring(thinkEnd + 8);
            } else {
              cleanCode = cleanCode.substring(0, thinkStart);
            }
          }
          if (cleanCode.includes('```')) {
            const match = cleanCode.match(/```[a-z]*\n([\s\S]*?)```/);
            if (match) {
              cleanCode = match[1];
            } else {
              cleanCode = cleanCode.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
            }
          }
          setResponseState({ fixedCode: cleanCode });
        }
      });
    } catch (err) {
      if (err.status === 429) {
        showRateLimitToast(err.message, err.retryAfter);
      } else {
        toast.error(err.message || 'AI request failed');
      }
    } finally {
      setLoadingState(false);
    }
  }, []);

  const withStreamAI = useCallback(
    async (url, body, setResponseState) => {
      setActiveOutputTab(OUTPUT_TABS.AI);
      await streamAI(url, body, setResponseState, setIsAILoading);
    },
    [setActiveOutputTab, streamAI]
  );

  const fix = useCallback(
    () =>
      withStreamAI(
        '/api/ai/fix-code',
        { code, error: stderr, language: LANGUAGES[language].name, model },
        setAiResponse
      ),
    [withStreamAI, code, stderr, language, model]
  );

  const explain = useCallback(() => {
    const sel = editorRef?.current?.getSelection();
    const selectedCode =
      sel && !sel.isEmpty() ? editorRef.current.getModel().getValueInRange(sel) : code;
    return withStreamAI(
      '/api/ai/explain-logic',
      { code: selectedCode, language: LANGUAGES[language].name, model },
      setAiResponse
    );
  }, [withStreamAI, code, language, editorRef, model]);

  const visualize = useCallback(
    () =>
      withStreamAI(
        '/api/ai/visualize',
        { code, language: LANGUAGES[language].name, model },
        setAiResponse
      ),
    [withStreamAI, code, language, model]
  );

  const generateTests = useCallback(
    () =>
      withStreamAI(
        '/api/ai/generate-tests',
        { code, language: LANGUAGES[language].name, model },
        setAiResponse
      ),
    [withStreamAI, code, language, model]
  );

  const audit = useCallback(
    () =>
      withStreamAI(
        '/api/ai/audit-code',
        { code, language: LANGUAGES[language].name, model },
        setAiResponse
      ),
    [withStreamAI, code, language, model]
  );

  const clearAI = useCallback(() => setAiResponse(null), []);

  const debugError = useCallback(async () => {
    if (!stderr) return;
    await streamAI(
      '/api/ai/explain-error',
      { code, error: stderr, language: LANGUAGES[language].name, model },
      setDebugResponse,
      setIsDebugLoading
    );
  }, [code, stderr, language, model, streamAI]);

  const clearDebug = useCallback(() => setDebugResponse(null), []);

  const analyzeComplexity = useCallback(async () => {
    await streamAI(
      '/api/ai/analyze-complexity',
      { code, language: LANGUAGES[language].name },
      setComplexityResponse,
      setIsComplexityLoading
    );
  }, [code, language, streamAI]);

  const clearComplexity = useCallback(() => setComplexityResponse(null), []);

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
    complexityResponse,
    isComplexityLoading,
    analyzeComplexity,
    clearComplexity,
  };
}

