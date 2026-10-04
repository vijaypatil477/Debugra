import { DICTIONARY_SET } from './spellcheckDictionary';
import { extractWordsFromCommentsAndStrings } from './spellcheckTokenizer';

function buildLineStartOffsets(text) {
  const offsets = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') offsets.push(i + 1);
  }
  return offsets;
}

function offsetToLineCol(offset, lineStarts) {
  // Binary search for last lineStart <= offset
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lineStarts[mid] <= offset) lo = mid + 1;
    else hi = mid - 1;
  }
  const lineIndex = hi; // 0-based
  const lineStart = lineStarts[lineIndex] ?? 0;
  const line = lineIndex + 1;
  const col = offset - lineStart + 1; // monaco is 1-based
  return { line, col };
}

function getMisspellings(words) {
  /** @type {{start:number,end:number,word:string,suggestion?:string}[]} */
  const miss = [];

  for (const w of words) {
    const normalized = w.word.toLowerCase();

    // Ignore if dictionary contains it.
    if (DICTIONARY_SET.has(normalized)) continue;

    // Also ignore common contractions / possessives by trying stripped form.
    const stripped = normalized.replace(/'s$/g, '').replace(/s'$/g, '');
    if (DICTIONARY_SET.has(stripped)) continue;

    miss.push({ ...w });
  }

  // Limit amount for perf/non-obtrusive behavior.
  return miss.slice(0, 200);
}

/**
 * @param {string} code
 * @param {any} monacoRangeCtor - monaco.Range constructor
 */
export function computeSpellcheckDecorations({ code, monacoRangeCtor }) {
  const words = extractWordsFromCommentsAndStrings(code);
  const miss = getMisspellings(words);

  const lineStarts = buildLineStartOffsets(code);

  /** @type {{ range:any, options:any }[]} */
  const decorations = [];

  for (const m of miss) {
    const startLC = offsetToLineCol(m.start, lineStarts);
    const endLC = offsetToLineCol(m.end, lineStarts);

    // Ensure we don't create invalid ranges.
    if (startLC.line > endLC.line) continue;

    decorations.push({
      range: new monacoRangeCtor(startLC.line, startLC.col, endLC.line, endLC.col),
      options: {
        inlineClassName: 'debugra-spellcheck-typo',
        hoverMessage: {
          value: `Possible typo: **${m.word}**`,
        },
      },
    });
  }

  return decorations;
}

