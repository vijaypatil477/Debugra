export const FILE_ICON_MAP = {
  py: 'python',
  js: 'javascript',
  ts: 'typescript',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  rb: 'ruby',
  php: 'php',
  swift: 'swift',
  sql: 'sqlite',
  sh: 'bash',
  json: 'json',
  md: 'markdown',
  env: 'env',
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
  env: 'Environment file',
  code: 'Code file',
};

export const getFileExtension = (filename = '') => {
  const normalizedName = filename.trim().toLowerCase();

  if (!normalizedName) return '';
  if (normalizedName === '.env' || normalizedName.endsWith('.env')) return 'env';

  const parts = normalizedName.split('.');
  return parts.length > 1 ? parts.pop() : '';
};

export const getFileIconType = (filename = '') => {
  const extension = getFileExtension(filename);
  return FILE_ICON_MAP[extension] || FILE_ICON_MAP.default;
};
