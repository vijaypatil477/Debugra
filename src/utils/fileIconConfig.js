export const FILE_ICON_MAP = {
  // Languages (extensions)
  py: 'python',
  js: 'javascript',
  cjs: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  cts: 'typescript',
  mts: 'typescript',
  jsx: 'javascript',
  tsx: 'typescript',

  java: 'java',
  cpp: 'cpp',
  h: 'c',
  hh: 'cpp',
  hpp: 'cpp',
  hxx: 'cpp',

  c: 'c',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  rb: 'ruby',
  php: 'php',
  swift: 'swift',
  sql: 'sqlite',

  sh: 'bash',
  bash: 'bash',

  json: 'json',
  md: 'markdown',
  mdx: 'markdown',

  env: 'env',
  dotenv: 'env',

  // Common configs/docs
  yml: 'env',
  yaml: 'env',
  toml: 'env',
  xml: 'env',
  html: 'env',
  css: 'env',
  txt: 'code',
  text: 'code',

  // Catch-all
  default: 'code',
};

export const FILE_ICON_LABELS = {
  python: 'Python file',
  javascript: 'JavaScript file',
  typescript: 'TypeScript file',
  java: 'Java file',
  cpp: 'C++ file',
  c: 'C file',
  csharp: 'C# file',
  go: 'Go file',
  rust: 'Rust file',
  ruby: 'Ruby file',
  php: 'PHP file',
  swift: 'Swift file',
  sqlite: 'SQLite file',
  bash: 'Bash file',
  json: 'JSON file',
  markdown: 'Markdown file',
  env: 'Environment/config file',
  dockerfile: 'Dockerfile',
  code: 'Code file',
};

export const getFileExtension = (filename = '') => {
  const normalizedName = filename.trim().toLowerCase();

  if (!normalizedName) return '';

  // Special case: Dockerfile / no-extension files
  if (normalizedName === 'dockerfile') return 'dockerfile';

  // Special case: env files
  if (normalizedName === '.env' || normalizedName.endsWith('.env')) return 'env';

  const parts = normalizedName.split('.');
  return parts.length > 1 ? parts.pop() : '';
};

export const getFileIconType = (filename = '') => {
  const extension = getFileExtension(filename);
  return FILE_ICON_MAP[extension] || FILE_ICON_MAP.default;
};
