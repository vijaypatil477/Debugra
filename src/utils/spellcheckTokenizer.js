// Tokenizer for scanning *comment blocks* and *string literals*.
// This is intentionally simple and language-agnostic.

const WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g;

function isSnakeOrCamelLike(word) {
  // camelCase or PascalCase or snake_case-like tokens are more likely identifiers.
  // We only decide based on presence of case transitions / underscore.
  // Here, input is alphabetic-only by WORD_RE, so we check casing.
  if (word.length < 3) return false;
  const hasUpper = /[A-Z]/.test(word);
  if (!hasUpper) return false;
  const hasLower = /[a-z]/.test(word);
  return hasLower; // mixed case => likely identifier-like
}

function normalizeWord(w) {
  return w.replace(/(^'+|'+$)/g, '').toLowerCase();
}

function shouldIgnoreWord(word) {
  const w = normalizeWord(word);
  if (!w) return true;

  // Ignore common dev tokens or too-short words.
  if (w.length <= 2) return true;

  // Ignore contractions as separate tokens (keep only alpha words).
  // WORD_RE already excludes numbers/punctuation.

  // Ignore camelCase-ish.
  if (isSnakeOrCamelLike(word)) return true;

  return false;
}

/**
 * Returns candidate words with their position ranges in the full text.
 * We only scan inside:
 *  - line comments: // ...
 *  - block comments: /* ... *\/ 
 *  - single-quoted strings: '...'
 *  - double-quoted strings: "..."
 *
 * Output positions are 0-based offsets into the original string.
 */
export function extractWordsFromCommentsAndStrings(text) {
  if (!text) return [];

  /** @type {{start:number,end:number,word:string}[]} */
  const results = [];

  // Simple single-pass state machine.
  let i = 0;
  let mode = 'code';

  // For quote modes, track which quote started it.
  let quoteChar = null;

  const pushMatch = (matchStart, matchEnd) => {
    const word = text.slice(matchStart, matchEnd);
    results.push({ start: matchStart, end: matchEnd, word });
  };

  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];

    if (mode === 'code') {
      // line comment
      if (ch === '/' && next === '/') {
        mode = 'line_comment';
        i += 2;
        continue;
      }
      // block comment
      if (ch === '/' && next === '*') {
        mode = 'block_comment';
        i += 2;
        continue;
      }
      // double quote string
      if (ch === '"') {
        mode = 'double_quote';
        quoteChar = '"';
        i += 1;
        continue;
      }
      // single quote string
      if (ch === "'") {
        mode = 'single_quote';
        quoteChar = "'";
        i += 1;
        continue;
      }

      i += 1;
      continue;
    }

    if (mode === 'line_comment') {
      if (ch === '\n' || ch === '\r') {
        mode = 'code';
        i += 1;
        continue;
      }

      // Scan words within this mode.
      const m = WORD_RE.exec(text.slice(i));
      if (m && m.index === 0) {
        const start = i + m.index;
        const end = start + m[0].length;
        if (!shouldIgnoreWord(m[0])) pushMatch(start, end);
        i = end;
        continue;
      }

      i += 1;
      continue;
    }

    if (mode === 'block_comment') {
      if (ch === '*' && next === '/') {
        mode = 'code';
        i += 2;
        continue;
      }

      const m = WORD_RE.exec(text.slice(i));
      if (m && m.index === 0) {
        const start = i + m.index;
        const end = start + m[0].length;
        if (!shouldIgnoreWord(m[0])) pushMatch(start, end);
        i = end;
        continue;
      }

      i += 1;
      continue;
    }

    if (mode === 'double_quote' || mode === 'single_quote') {
      // handle escapes
      if (ch === '\\') {
        i += 2;
        continue;
      }

      if (ch === quoteChar) {
        mode = 'code';
        quoteChar = null;
        i += 1;
        continue;
      }

      const m = WORD_RE.exec(text.slice(i));
      if (m && m.index === 0) {
        const start = i + m.index;
        const end = start + m[0].length;
        if (!shouldIgnoreWord(m[0])) pushMatch(start, end);
        i = end;
        continue;
      }

      i += 1;
      continue;
    }

    // Fallback
    i += 1;
  }

  return results;
}

