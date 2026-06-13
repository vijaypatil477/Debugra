const debounceTimerRef = useRef(null);
const lastRequestRef = useRef(null);
const decorationIdsRef = useRef([]);
const requestSeqRef = useRef(0);

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

  const requestSeq = ++requestSeqRef.current;

  try {
    const result = await aiInlineComplete(
      prefix,
      suffix,
      LANGUAGES[language].name
    );

    // Ignore stale responses
    if (requestSeq !== requestSeqRef.current) return;

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

    if (requestSeq === requestSeqRef.current) {
      clearSuggestion();
    }
  } finally {
    if (requestSeq === requestSeqRef.current) {
      setIsLoading(false);
    }
  }
}, [language, editorRef, clearSuggestion]);