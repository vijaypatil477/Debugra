import { useState, useEffect, useRef, useCallback } from 'react';
import './SearchReplacePanel.css';

const WORD_SEPARATORS = '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?';

export default function SearchReplacePanel({ editorRef, onClose }) {
  const [searchValue, setSearchValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1);
  const [regexError, setRegexError] = useState(false);

  const matchesRef = useRef([]);
  const decorationIdsRef = useRef([]);
  const currentIdxRef = useRef(-1);
  const searchInputRef = useRef(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const updateDecorations = useCallback(
    (matches, activeIdx) => {
      const editor = editorRef.current;
      if (!editor) return;
      const newDecorations = matches.map((m, i) => ({
        range: m.range,
        options: {
          inlineClassName: i === activeIdx ? 'sr-match-current' : 'sr-match',
          overviewRulerColor: i === activeIdx ? '#f5c518' : '#ea5c00',
          overviewRulerLane: 4,
        },
      }));
      decorationIdsRef.current = editor.deltaDecorations(
        decorationIdsRef.current,
        newDecorations
      );
    },
    [editorRef]
  );

  const runSearch = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (!searchValue.trim()) {
      matchesRef.current = [];
      currentIdxRef.current = -1;
      setMatchCount(0);
      setCurrentMatchIdx(-1);
      setRegexError(false);
      editor.deltaDecorations(decorationIdsRef.current, []);
      decorationIdsRef.current = [];
      return;
    }

    const model = editor.getModel();
    if (!model) return;

    try {
      setRegexError(false);
      const wordSeps = wholeWord ? WORD_SEPARATORS : null;
      const matches =
        model.findMatches(searchValue, false, useRegex, matchCase, wordSeps, false) || [];
      matchesRef.current = matches;
      setMatchCount(matches.length);

      if (matches.length > 0) {
        currentIdxRef.current = 0;
        setCurrentMatchIdx(0);
        updateDecorations(matches, 0);
        editor.revealRangeInCenter(matches[0].range);
        editor.setSelection(matches[0].range);
      } else {
        currentIdxRef.current = -1;
        setCurrentMatchIdx(-1);
        updateDecorations([], -1);
      }
    } catch {
      if (useRegex) setRegexError(true);
      matchesRef.current = [];
      currentIdxRef.current = -1;
      setMatchCount(0);
      setCurrentMatchIdx(-1);
    }
  }, [searchValue, useRegex, matchCase, wholeWord, editorRef, updateDecorations]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  // Clear decorations when panel closes
  useEffect(() => {
    const editor = editorRef.current;
    return () => {
      editor?.deltaDecorations(decorationIdsRef.current, []);
    };
  }, [editorRef]);

  const navigate = useCallback(
    (dir) => {
      const matches = matchesRef.current;
      if (!matches.length) return;
      const editor = editorRef.current;
      const next =
        dir === 'next'
          ? (currentIdxRef.current + 1) % matches.length
          : (currentIdxRef.current - 1 + matches.length) % matches.length;
      currentIdxRef.current = next;
      setCurrentMatchIdx(next);
      updateDecorations(matches, next);
      editor.setSelection(matches[next].range);
      editor.revealRangeInCenter(matches[next].range);
    },
    [editorRef, updateDecorations]
  );

  const replaceCurrent = useCallback(() => {
    const matches = matchesRef.current;
    const idx = currentIdxRef.current;
    if (!matches.length || idx < 0) return;
    const editor = editorRef.current;
    const model = editor.getModel();
    const match = matches[idx];

    let replacement = replaceValue;
    if (useRegex) {
      try {
        const flags = matchCase ? '' : 'i';
        replacement = model
          .getValueInRange(match.range)
          .replace(new RegExp(searchValue, flags), replaceValue);
      } catch {
        // fall back to literal replacement
      }
    }

    editor.executeEdits('search-replace', [{ range: match.range, text: replacement }]);
    setTimeout(runSearch, 0);
  }, [replaceValue, useRegex, matchCase, searchValue, editorRef, runSearch]);

  const replaceAll = useCallback(() => {
    const matches = matchesRef.current;
    if (!matches.length) return;
    const editor = editorRef.current;
    const model = editor.getModel();

    const edits = matches.map((m) => {
      let replacement = replaceValue;
      if (useRegex) {
        try {
          const flags = matchCase ? '' : 'i';
          replacement = model
            .getValueInRange(m.range)
            .replace(new RegExp(searchValue, flags), replaceValue);
        } catch {
          // fall back to literal replacement
        }
      }
      return { range: m.range, text: replacement };
    });

    editor.executeEdits('search-replace-all', edits);
    setTimeout(runSearch, 0);
  }, [replaceValue, useRegex, matchCase, searchValue, editorRef, runSearch]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      navigate(e.shiftKey ? 'prev' : 'next');
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleReplaceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      replaceCurrent();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="sr-panel" role="dialog" aria-label="Search and Replace">
      {/* Search row */}
      <div className="sr-row">
        <div className={`sr-input-wrap ${regexError ? 'sr-error' : ''}`}>
          <input
            ref={searchInputRef}
            className="sr-input"
            placeholder="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            aria-label="Search"
            spellCheck={false}
          />
          {searchValue && (
            <span className="sr-match-count" aria-live="polite">
              {matchCount === 0 ? 'No results' : `${currentMatchIdx + 1} of ${matchCount}`}
            </span>
          )}
          <div className="sr-toggles" role="group" aria-label="Search options">
            <button
              className={`sr-toggle ${matchCase ? 'active' : ''}`}
              onClick={() => setMatchCase((v) => !v)}
              title="Match Case"
              aria-pressed={matchCase}
            >
              Aa
            </button>
            <button
              className={`sr-toggle ${wholeWord ? 'active' : ''}`}
              onClick={() => setWholeWord((v) => !v)}
              title="Match Whole Word"
              aria-pressed={wholeWord}
            >
              \b
            </button>
            <button
              className={`sr-toggle ${useRegex ? 'active' : ''} ${regexError ? 'sr-toggle-error' : ''}`}
              onClick={() => setUseRegex((v) => !v)}
              title="Use Regular Expression"
              aria-pressed={useRegex}
            >
              .*
            </button>
          </div>
        </div>
        <div className="sr-nav-btns">
          <button
            className="sr-nav-btn"
            onClick={() => navigate('prev')}
            title="Previous Match (Shift+Enter)"
            aria-label="Previous Match"
            disabled={!matchCount}
          >
            ↑
          </button>
          <button
            className="sr-nav-btn"
            onClick={() => navigate('next')}
            title="Next Match (Enter)"
            aria-label="Next Match"
            disabled={!matchCount}
          >
            ↓
          </button>
        </div>
        <button className="sr-close-btn" onClick={onClose} aria-label="Close Search Panel">
          ×
        </button>
      </div>

      {/* Replace row */}
      <div className="sr-row">
        <div className="sr-input-wrap">
          <input
            className="sr-input"
            placeholder="Replace"
            value={replaceValue}
            onChange={(e) => setReplaceValue(e.target.value)}
            onKeyDown={handleReplaceKeyDown}
            aria-label="Replace"
            spellCheck={false}
          />
        </div>
        <div className="sr-action-btns">
          <button
            className="sr-action-btn"
            onClick={replaceCurrent}
            disabled={!matchCount}
            title="Replace (Enter)"
          >
            Replace
          </button>
          <button
            className="sr-action-btn"
            onClick={replaceAll}
            disabled={!matchCount}
            title="Replace All"
          >
            All
          </button>
        </div>
      </div>
    </div>
  );
}
