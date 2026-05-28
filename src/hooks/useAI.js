import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  aiFixCode,
  aiExplainLogic,
  aiVisualizeExecution,
  aiGenerateTests,
  aiAuditCode,
  aiGenerateDocstring,
} from '../services/api';
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
export function useAI({ language, code, stderr, setActiveOutputTab, editorRef }) {
  const [aiResponse, setAiResponse] = useState(null);
  const [isAILoading, setIsAILoading] = useState(false);

  const withAI = useCallback(
    async (action) => {
      setIsAILoading(true);
      setActiveOutputTab(OUTPUT_TABS.AI);
      try {
        const result = await action();
        setAiResponse(result);
      } catch (err) {
        toast.error(err.message || 'AI request failed');
      } finally {
        setIsAILoading(false);
      }
    },
    [setActiveOutputTab]
  );

  const fix = useCallback(
    () =>
      withAI(async () => {
        const result = await aiFixCode(code, stderr, LANGUAGES[language].name);
        return result;
      }),
    [withAI, code, stderr, language]
  );

  const explain = useCallback(
    () =>
      withAI(async () => {
        const sel = editorRef?.current?.getSelection();
        const selectedCode =
          sel && !sel.isEmpty() ? editorRef.current.getModel().getValueInRange(sel) : code;
        return await aiExplainLogic(selectedCode, LANGUAGES[language].name);
      }),
    [withAI, code, language, editorRef]
  );

  const visualize = useCallback(
    () => withAI(() => aiVisualizeExecution(code, LANGUAGES[language].name)),
    [withAI, code, language]
  );

  const generateTests = useCallback(
    () => withAI(() => aiGenerateTests(code, LANGUAGES[language].name)),
    [withAI, code, language]
  );

  const audit = useCallback(
    () => withAI(() => aiAuditCode(code, LANGUAGES[language].name)),
    [withAI, code, language]
  );

  const generateDocstring = useCallback(
    () =>
      withAI(async () => {
        const editor = editorRef?.current;
        if (!editor) throw new Error('Editor not initialized');

        const sel = editor.getSelection();
        const selectedCode =
          sel && !sel.isEmpty() ? editor.getModel().getValueInRange(sel) : '';

        if (!selectedCode || !selectedCode.trim()) {
          throw new Error('Please select a function or block of code in the editor to generate documentation.');
        }

        const result = await aiGenerateDocstring(selectedCode, LANGUAGES[language].name);
        
        const responseData = result.content || result;
        const generatedDoc = responseData?.docstring;
        if (!generatedDoc) {
          throw new Error('Failed to generate docstring. Try highlighting the function definition.');
        }

        const model = editor.getModel();
        const lineText = model.getLineContent(sel.startLineNumber);
        const matchIndentation = lineText.match(/^\s*/);
        const indentation = matchIndentation ? matchIndentation[0] : '';

        const docLines = generatedDoc.split('\n');
        const indentedDoc = docLines
          .map((line) => indentation + line)
          .join('\n');

        const range = {
          startLineNumber: sel.startLineNumber,
          startColumn: 1,
          endLineNumber: sel.startLineNumber,
          endColumn: 1,
        };

        editor.executeEdits('docstring-generator', [
          {
            range,
            text: indentedDoc + '\n',
            forceMoveMarkers: true,
          },
        ]);

        toast.success('Docstring generated and inserted!');
        return result;
      }),
    [withAI, language, editorRef]
  );
  const clearAI = useCallback(() => setAiResponse(null), []);

  return {
    aiResponse,
    isAILoading,
    fix,
    explain,
    visualize,
    generateTests,
    audit,
    generateDocstring,
    clearAI,
  };
}
