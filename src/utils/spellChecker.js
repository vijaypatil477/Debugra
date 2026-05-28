/**
 * Core Spell Checker Utility for Debugra Code Editor
 * 
 * Supports:
 * - Base Dictionary (~1,500 common English words + tech terms)
 * - Dynamic 10,000 English Words Dictionary (asynchronously fetched from a reliable CDN and cached locally)
 * - Intelligent splitting of camelCase, snake_case, PascalCase, and contractions
 * - Heuristic filters to ignore keywords, APIs, short variables (<=2 chars), and ALL_CAPS constants (<=4 chars)
 * - User Dictionary management saved to localStorage
 */

// ─── BASE PROGRAMMING KEYWORDS & BUILT-INS ────────────────────────────────────
const TECH_KEYWORDS = new Set([
  // JavaScript / TypeScript / Node
  'const', 'let', 'var', 'function', 'class', 'constructor', 'return', 'import', 'export', 'from',
  'async', 'await', 'promise', 'then', 'catch', 'try', 'finally', 'throw', 'error', 'new', 'this',
  'super', 'extends', 'implements', 'interface', 'typeof', 'instanceof', 'void', 'delete', 'in',
  'of', 'with', 'yield', 'package', 'private', 'protected', 'public', 'static', 'debugger', 'default',
  'case', 'switch', 'if', 'else', 'do', 'while', 'for', 'break', 'continue', 'true', 'false', 'null',
  'undefined', 'nan', 'infinity', 'require', 'module', 'exports', 'console', 'log', 'info', 'warn',
  'window', 'document', 'body', 'head', 'localStorage', 'sessionStorage', 'cookies', 'indexedDB',
  'fetch', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Math', 'JSON', 'stringify',
  'parse', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Object', 'Array', 'String', 'Number',
  'Boolean', 'Date', 'RegExp', 'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError',

  // Python
  'def', 'elif', 'as', 'lambda', 'pass', 'global', 'nonlocal', 'assert', 'raise', 'except', 'self',
  'none', 'and', 'or', 'not', 'is', 'del', 'print', 'range', 'len', 'list', 'dict', 'set', 'tuple',
  'str', 'int', 'float', 'bool', 'zip', 'enumerate', 'map', 'filter', 'sum', 'min', 'max', 'abs',

  // Java / C / C++ / C#
  'final', 'abstract', 'void', 'double', 'char', 'short', 'long', 'struct', 'union', 'typedef',
  'sizeof', 'volatile', 'register', 'extern', 'inline', 'namespace', 'using', 'virtual', 'override',
  'sealed', 'readonly', 'params', 'out', 'ref', 'checked', 'unchecked', 'lock', 'delegate', 'event',
  'string', 'bool', 'int', 'uint', 'long', 'ulong', 'float', 'double', 'decimal', 'sbyte', 'byte',

  // Rust
  'fn', 'mut', 'pub', 'use', 'mod', 'impl', 'trait', 'where', 'match', 'loop', 'unsafe', 'crate',

  // HTML / CSS / SQL
  'div', 'span', 'class', 'href', 'src', 'alt', 'width', 'height', 'style', 'color', 'background',
  'select', 'where', 'insert', 'update', 'delete', 'create', 'table', 'database', 'index', 'join',

  // Frameworks & Tools
  'react', 'redux', 'hook', 'hooks', 'state', 'effect', 'callback', 'memo', 'ref', 'context',
  'reducer', 'dispatch', 'action', 'payload', 'monaco', 'editor', 'vite', 'eslint', 'prettier',
  'eslint-disable', 'eslint-enable', 'debugra', 'wandbox', 'groq', 'firebase', 'firestore', 'uid', 'uuid'
]);

// ─── BASE ENGLISH DICTIONARY (~1,500 WORDS FOR IMMEDIATE OFFLINE USAGE) ────────
const BASE_ENGLISH_WORDS = [
  'the', 'and', 'to', 'of', 'a', 'is', 'in', 'that', 'it', 'you', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they',
  'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we', 'when',
  'your', 'can', 'said', 'there', 'use', 'an', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will', 'up', 'other',
  'about', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'him', 'into', 'time',
  'has', 'look', 'two', 'more', 'write', 'go', 'see', 'number', 'no', 'way', 'could', 'people', 'my', 'than', 'first',
  'water', 'been', 'call', 'who', 'oil', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may',
  'part', 'over', 'new', 'sound', 'take', 'only', 'little', 'work', 'know', 'place', 'year', 'live', 'me', 'back', 'give',
  'most', 'very', 'after', 'thing', 'our', 'just', 'name', 'good', 'sentence', 'man', 'think', 'say', 'great', 'where',
  'help', 'through', 'much', 'before', 'line', 'right', 'too', 'mean', 'old', 'any', 'same', 'tell', 'boy', 'follow',
  'came', 'want', 'show', 'also', 'around', 'form', 'three', 'small', 'set', 'put', 'end', 'does', 'another', 'well',
  'large', 'must', 'big', 'even', 'such', 'because', 'turn', 'here', 'why', 'ask', 'went', 'men', 'read', 'need', 'land',
  'different', 'home', 'us', 'move', 'try', 'kind', 'hand', 'picture', 'again', 'change', 'off', 'play', 'spell', 'air',
  'away', 'animal', 'house', 'point', 'page', 'letter', 'mother', 'answer', 'found', 'study', 'still', 'learn', 'should',
  'america', 'world', 'high', 'every', 'near', 'add', 'food', 'between', 'own', 'below', 'country', 'plant', 'last',
  'school', 'father', 'keep', 'tree', 'never', 'start', 'city', 'earth', 'eye', 'light', 'thought', 'head', 'under',
  'story', 'saw', 'left', 'don\'t', 'few', 'while', 'along', 'might', 'close', 'something', 'seem', 'next', 'hard',
  'open', 'example', 'begin', 'life', 'always', 'those', 'both', 'paper', 'together', 'got', 'group', 'often', 'run',
  'important', 'until', 'children', 'side', 'feet', 'car', 'mile', 'night', 'walk', 'white', 'sea', 'began', 'grow',
  'took', 'river', 'four', 'carry', 'state', 'once', 'book', 'hear', 'stop', 'without', 'second', 'late', 'miss',
  'idea', 'enough', 'eat', 'face', 'watch', 'far', 'indian', 'real', 'almost', 'let', 'above', 'girl', 'sometimes',
  'mountain', 'cut', 'young', 'talk', 'soon', 'list', 'song', 'being', 'leave', 'family', 'it\'s', 'body', 'music',
  'color', 'stand', 'sun', 'questions', 'fish', 'area', 'mark', 'dog', 'horse', 'birds', 'problem', 'complete',
  'room', 'knew', 'since', 'ever', 'piece', 'told', 'usually', 'didn\'t', 'friends', 'easy', 'heard', 'order', 'red',
  'door', 'sure', 'become', 'top', 'ship', 'across', 'today', 'during', 'short', 'better', 'best', 'however', 'low',
  'hours', 'black', 'products', 'happened', 'whole', 'measure', 'remember', 'early', 'waves', 'reached', 'wind',
  'listen', 'rock', 'space', 'covered', 'fast', 'several', 'hold', 'himself', 'toward', 'five', 'step', 'morning',
  'passed', 'vowel', 'true', 'hundred', 'against', 'pattern', 'numerical', 'table', 'north', 'slow', 'money', 'map',
  'farm', 'leather', 'pull', 'draw', 'voice', 'seen', 'cold', 'cried', 'plan', 'notice', 'south', 'sing', 'war',
  'ground', 'fall', 'king', 'town', 'i\'ll', 'unit', 'figure', 'certain', 'field', 'travel', 'wood', 'fire', 'upon',
  'english', 'road', 'half', 'ten', 'fly', 'gave', 'box', 'finally', 'wait', 'correct', 'oh', 'quickly', 'person',
  'became', 'shown', 'minutes', 'strong', 'verb', 'stars', 'front', 'feel', 'fact', 'inches', 'street', 'decided',
  'contain', 'course', 'surface', 'produce', 'building', 'ocean', 'class', 'note', 'nothing', 'rest', 'carely',
  'scientists', 'inside', 'wheels', 'stay', 'green', 'known', 'island', 'week', 'less', 'machine', 'base', 'ago',
  'stood', 'plane', 'system', 'behind', 'ran', 'round', 'boat', 'game', 'force', 'brought', 'understand', 'warm',
  'common', 'bring', 'explain', 'dry', 'though', 'language', 'shape', 'deep', 'thousands', 'yes', 'clear', 'equation',
  'yet', 'government', 'filled', 'heat', 'full', 'hot', 'check', 'object', 'am', 'rule', 'among', 'noun', 'power',
  'cannot', 'able', 'six', 'size', 'dark', 'ball', 'material', 'special', 'heavy', 'fine', 'pair', 'circle', 'include',
  'built', 'built-ins', 'builtins', 'error', 'warning', 'success', 'fail', 'failed', 'setup', 'init', 'initial',
  'update', 'render', 'width', 'height', 'data', 'payload', 'query', 'params', 'item', 'items', 'list', 'array',
  'object', 'string', 'number', 'boolean', 'key', 'keys', 'value', 'values', 'user', 'users', 'admin', 'profile',
  'settings', 'avatar', 'icon', 'icons', 'logo', 'button', 'input', 'label', 'modal', 'dialog', 'popup', 'hover',
  'click', 'focus', 'blur', 'active', 'disabled', 'readonly', 'hidden', 'visible', 'show', 'hide', 'toggle', 'open',
  'close', 'db', 'auth', 'login', 'logout', 'signin', 'signout', 'signup', 'register', 'token', 'session', 'cookie',
  'secure', 'security', 'crypto', 'hash', 'encrypt', 'decrypt', 'id', 'ids', 'gura', 'debugra', 'wandbox', 'groq',
  'firebase', 'firestore', 'url', 'uri', 'http', 'https', 'api', 'json', 'xml', 'yaml', 'csv', 'html', 'css', 'sql',
  'bash', 'shell', 'npm', 'yarn', 'pnpm', 'node', 'package', 'version', 'config', 'theme', 'font', 'size', 'editor',
  'tab', 'file', 'folder', 'directory', 'path', 'line', 'column', 'cursor', 'history', 'saved', 'cloud', 'download',
  'run', 'running', 'exec', 'execute', 'execution', 'output', 'stdout', 'stderr', 'clear', 'audit', 'explain',
  'fix', 'test', 'tests', 'visualize', 'zoom', 'blur', 'chime', 'volume', 'muted', 'video', 'audio', 'call',
  'room', 'rooms', 'password', 'passcode', 'join', 'leave', 'online', 'users', 'chat', 'message', 'messages',
  'send', 'receive', 'peer', 'vote', 'democratic', 'popup', 'toast', 'notification', 'app', 'application',
  'development', 'developer', 'code', 'coding', 'programming', 'programmer', 'variable', 'variables', 'function',
  'functions', 'class', 'classes', 'method', 'methods', 'property', 'properties', 'constant', 'constants',
  'keyword', 'keywords', 'syntax', 'comment', 'comments', 'string', 'strings', 'number', 'numbers', 'boolean',
  'booleans', 'array', 'arrays', 'object', 'objects', 'null', 'undefined', 'nan', 'void', 'never', 'unknown',
  'any', 'map', 'set', 'weakmap', 'weakset', 'promise', 'async', 'await', 'generator', 'iterator', 'symbol',
  'regex', 'regexp', 'match', 'replace', 'split', 'join', 'search', 'test', 'exec', 'slice', 'splice',
  'push', 'pop', 'shift', 'unshift', 'concat', 'reverse', 'sort', 'filter', 'reduce', 'forEach', 'some',
  'every', 'find', 'findIndex', 'includes', 'indexOf', 'lastIndexOf', 'flat', 'flatMap', 'fill', 'keys',
  'values', 'entries', 'length', 'size', 'clear', 'delete', 'has', 'add', 'get', 'set', 'resolve', 'reject',
  'all', 'race', 'any', 'allSettled', 'then', 'catch', 'finally', 'throw', 'try', 'catch', 'error', 'stack',
  'message', 'name', 'type', 'range', 'reference', 'syntax', 'uri', 'eval', 'math', 'abs', 'ceil', 'floor',
  'round', 'max', 'min', 'pow', 'sqrt', 'random', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'log', 'exp', 'pi', 'e', 'ln2', 'ln10', 'log2e', 'log10e', 'sqrt1_2', 'sqrt2', 'date', 'now', 'parse',
  'utc', 'year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond', 'time', 'timezone', 'offset',
  'local', 'global', 'scope', 'closure', 'context', 'this', 'super', 'constructor', 'prototype', 'instance',
  'factory', 'singleton', 'builder', 'observer', 'strategy', 'decorator', 'adapter', 'facade', 'proxy',
  'bridge', 'composite', 'flyweight', 'command', 'mediator', 'memento', 'state', 'template', 'visitor',
  'chain', 'responsibility', 'mvc', 'mvvm', 'flux', 'redux', 'action', 'reducer', 'store', 'dispatch',
  'subscribe', 'middleware', 'thunk', 'saga', 'epic', 'router', 'route', 'navigation', 'link', 'redirect',
  'guard', 'resolver', 'view', 'component', 'directive', 'pipe', 'service', 'module', 'inject', 'dependency',
  'injection', 'provider', 'token', 'factory', 'value', 'constant', 'config', 'run', 'bootstrap', 'compile',
  'link', 'controller', 'scope', 'digest', 'apply', 'watch', 'template', 'styles', 'shadow', 'dom', 'virtual',
  'diff', 'patch', 'props', 'state', 'hooks', 'effect', 'layout', 'callback', 'memo', 'ref', 'context',
  'reducer', 'imperative', 'handle', 'debug', 'value', 'display', 'custom', 'element', 'web', 'components',
  'template', 'slot', 'shadow', 'root', 'attach', 'mode', 'open', 'closed', 'event', 'listener', 'bubble',
  'capture', 'cancel', 'prevent', 'default', 'stop', 'propagation', 'immediate', 'target', 'current',
  'phase', 'time', 'stamp', 'is', 'trusted', 'detail', 'custom', 'event', 'mouse', 'keyboard', 'focus',
  'form', 'submit', 'reset', 'change', 'input', 'select', 'textarea', 'invalid', 'valid', 'check',
  'uncheck', 'radio', 'checkbox', 'button', 'text', 'password', 'email', 'number', 'tel', 'url', 'search',
  'date', 'time', 'datetime', 'month', 'week', 'color', 'file', 'hidden', 'range', 'image', 'submit',
  'reset', 'button', 'canvas', 'svg', 'audio', 'video', 'source', 'track', 'embed', 'object', 'param',
  'iframe', 'picture', 'source', 'img', 'map', 'area', 'table', 'caption', 'colgroup', 'col', 'thead',
  'tbody', 'tfoot', 'tr', 'th', 'td', 'form', 'fieldset', 'legend', 'label', 'input', 'button', 'select',
  'datalist', 'optgroup', 'option', 'textarea', 'keygen', 'output', 'progress', 'meter', 'details',
  'summary', 'menu', 'menuitem', 'applet', 'acronym', 'bgsound', 'dir', 'frame', 'frameset', 'noframes',
  'isindex', 'listing', 'xmp', 'nextid', 'noembed', 'plaintext', 'rb', 'rtc', 'strike', 'basefont',
  'big', 'blink', 'center', 'font', 'marquee', 'multicol', 'nobr', 'spacer', 'tt', 'u', 'var',
  'excellent', 'awesome', 'great', 'cool', 'nice', 'good', 'fine', 'perfect', 'beautiful', 'premium',
  'gorgeous', 'stunning', 'amazing', 'fantastic', 'wonderful', 'superb', 'outstanding', 'extraordinary',
  'splendid', 'magnificent', 'marvellous', 'brilliant', 'smart', 'intelligent', 'clever', 'genius',
  'expert', 'professional', 'master', 'guru', 'wizard', 'ninja', 'rockstar', 'hero', 'champion',
  'developer', 'engineer', 'architect', 'designer', 'analyst', 'manager', 'director', 'lead',
  'principal', 'senior', 'junior', 'intern', 'student', 'teacher', 'professor', 'mentor', 'coach',
  'awesome', 'awesume', // add a common typo to test or keep it correct
];

// Combine tech words and base English words into the starting offline dictionary
const baseDictionary = new Set([
  ...Array.from(TECH_KEYWORDS),
  ...BASE_ENGLISH_WORDS.map(w => w.toLowerCase())
]);

// ─── DYNAMIC CDN DICTIONARY LOADER ────────────────────────────────────────────
// Stores CDN-loaded words
let extendedDictionary = new Set();
let isCDNDictionaryLoaded = false;

/**
 * Asynchronously loads the larger 10,000-word English list from a CDN.
 * Caches it in localStorage to enable instant loading on subsequent runs.
 */
export async function loadCDNDictionary() {
  if (isCDNDictionaryLoaded) return;

  const CACHE_KEY = 'debugra-cached-10k-words';
  const CACHE_TIME_KEY = 'debugra-cached-10k-words-time';
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  // 1. Try to load from localStorage cache first
  try {
    const cachedWordsJSON = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const now = Date.now();

    if (cachedWordsJSON && cachedTime && (now - Number(cachedTime)) < SEVEN_DAYS_MS) {
      const parsedWords = JSON.parse(cachedWordsJSON);
      if (Array.isArray(parsedWords) && parsedWords.length > 0) {
        extendedDictionary = new Set(parsedWords.map(w => w.toLowerCase()));
        isCDNDictionaryLoaded = true;
        // console.log(`[SpellChecker] Loaded ${extendedDictionary.size} words from localStorage cache.`);
        return;
      }
    }
  } catch (err) {
    console.warn('[SpellChecker] Error reading from localStorage cache:', err);
  }

  // 2. Fetch from high-quality public CDN
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt'
    );
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    
    const text = await response.text();
    const words = text
      .split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 0);

    if (words.length > 0) {
      extendedDictionary = new Set(words);
      isCDNDictionaryLoaded = true;

      // Cache it
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(words));
        localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
      } catch (cacheErr) {
        console.warn('[SpellChecker] Failed to save dictionary cache:', cacheErr);
      }
      
      // console.log(`[SpellChecker] Successfully fetched and cached ${words.length} words from CDN.`);
    }
  } catch (err) {
    console.error('[SpellChecker] Failed to fetch dictionary from CDN. Running offline mode.', err);
  }
}

// ─── USER DICTIONARY (LOCAL STORAGE) ──────────────────────────────────────────
const USER_DICT_KEY = 'debugra-custom-words';

/**
 * Returns the Set of user custom ignored words from localStorage
 */
export function getUserDictionary() {
  try {
    const stored = localStorage.getItem(USER_DICT_KEY);
    return stored ? new Set(JSON.parse(stored).map(w => w.toLowerCase())) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Adds a word to the user's custom dictionary in localStorage
 */
export function addToUserDictionary(word) {
  if (!word) return;
  const cleanWord = word.trim().toLowerCase();
  const dict = getUserDictionary();
  dict.add(cleanWord);
  localStorage.setItem(USER_DICT_KEY, JSON.stringify(Array.from(dict)));
}

/**
 * Removes a word from the user's custom dictionary in localStorage
 */
export function removeFromUserDictionary(word) {
  if (!word) return;
  const cleanWord = word.trim().toLowerCase();
  const dict = getUserDictionary();
  dict.delete(cleanWord);
  localStorage.setItem(USER_DICT_KEY, JSON.stringify(Array.from(dict)));
}

// ─── WORD SPLITTER & VALIDATION ───────────────────────────────────────────────

/**
 * Intelligently splits a larger string into individual checkable sub-words.
 * Supports CamelCase, snake_case, PascalCase, contractions.
 */
export function splitIntoSubWords(text) {
  const wordMatches = [];
  // Match alphabetical strings (with optional inner single quote for contractions like don't or user's)
  const regex = /[a-zA-Z]+('[a-zA-Z]+)?/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const rawWord = match[0];
    const startIndex = match.index;

    // Split CamelCase, PascalCase and snake_case / underscores
    // e.g. "myAwesomeVariable" -> ["my", "Awesome", "Variable"]
    // e.g. "MAX_LIMIT" -> ["MAX", "LIMIT"]
    const subWordTokens = rawWord
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')        // lowercase/digit to uppercase transition
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')    // acronym boundary like XMLHttpRequest -> XML_Http_Request
      .split(/[^a-zA-Z']+/);                        // split by non-letters except inner single quotes

    let lastOffset = 0;
    for (const token of subWordTokens) {
      if (!token) continue;

      // Find precise index of the token inside rawWord
      const tokenIndex = rawWord.indexOf(token, lastOffset);
      if (tokenIndex !== -1) {
        wordMatches.push({
          word: token,
          originalWord: rawWord,
          startIndex: startIndex + tokenIndex,
          length: token.length
        });
        lastOffset = tokenIndex + token.length;
      }
    }
  }

  return wordMatches;
}

/**
 * Assesses whether a specific sub-word is recognized/correct
 */
export function isWordValid(word, userDict = new Set()) {
  const cleanWord = word.trim().toLowerCase();

  // HEURISTIC 1: Ignore very short words (length <= 2)
  if (cleanWord.length <= 2) return true;

  // HEURISTIC 2: Ignore ALL CAPS abbreviation words (length <= 4, e.g. JSON, HTML, CORS)
  if (word === word.toUpperCase() && word.length <= 4) return true;

  // HEURISTIC 3: Ignore strings that contain digits (regex match handles non-digits, but extra safety)
  if (/\d/.test(word)) return true;

  // Check custom user dictionary
  if (userDict.has(cleanWord)) return true;

  // Check base programming keywords & offline dictionary
  if (baseDictionary.has(cleanWord)) return true;

  // Check CDN loaded dictionary
  if (isCDNDictionaryLoaded && extendedDictionary.has(cleanWord)) return true;

  return false;
}

/**
 * Performs full spelling analysis on the provided code/text content.
 * Returns an array of unrecognized subwords with coordinates.
 */
export function spellCheckText(text, userDictSet = null) {
  if (!text) return [];

  const userDict = userDictSet || getUserDictionary();
  const subWords = splitIntoSubWords(text);
  const typos = [];

  for (const item of subWords) {
    if (!isWordValid(item.word, userDict)) {
      typos.push(item);
    }
  }

  return typos;
}
