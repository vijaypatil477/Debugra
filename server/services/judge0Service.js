const axios = require('axios');

// Configurable execution endpoints and settings
const WANDBOX_API = process.env.WANDBOX_API_URL || 'https://wandbox.org/api/compile.json';
const PISTON_API = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute';
const DEFAULT_PROVIDER = process.env.CODE_EXECUTION_PROVIDER || 'wandbox';
const IS_FALLBACK_ENABLED = process.env.CODE_EXECUTION_FALLBACK !== 'false';

// Mapping frontend IDs to Wandbox compiler names
const WANDBOX_COMPILERS = {
  71: 'cpython-3.13.8', // Python
  63: 'nodejs-20.17.0', // JavaScript
  80: 'typescript-5.6.2', // TypeScript
  62: 'openjdk-jdk-21+35', // Java
  54: 'gcc-13.2.0', // C++
  55: 'gcc-13.2.0-c', // C
  60: 'go-1.23.2', // Go
  73: 'rust-1.82.0', // Rust
  56: 'dotnetcore-8.0.402', // C#
  72: 'ruby-3.4.9', // Ruby
  68: 'php-8.3.12', // PHP
  64: 'lua-5.4.7', // Lua
  81: 'scala-3.5.1', // Scala
  61: 'ghc-9.10.1', // Haskell
  82: 'sqlite-3.46.1', // SQLite
  46: 'bash', // Bash
  83: 'swift-6.0.1', // Swift
  85: 'perl-5.40.0', // Perl
};

// Extra compiler flags per language for Wandbox
const COMPILER_OPTIONS = {
  'gcc-13.2.0': '-std=c++17',
  'gcc-13.2.0-c': '-std=c11',
};

// Mapping frontend IDs to Piston compiler names
const PISTON_LANGUAGES = {
  71: 'python',
  63: 'javascript',
  80: 'typescript',
  62: 'java',
  54: 'cpp',
  55: 'c',
  60: 'go',
  73: 'rust',
  56: 'csharp',
  72: 'ruby',
  68: 'php',
  64: 'lua',
  81: 'scala',
  61: 'haskell',
  82: 'sqlite3',
  46: 'bash',
  83: 'swift',
  85: 'perl',
};

// Piston language standard filenames for isolated execution
const PISTON_LANG_FILES = {
  71: 'main.py',
  63: 'main.js',
  80: 'main.ts',
  62: 'Main.java',
  54: 'main.cpp',
  55: 'main.c',
  60: 'main.go',
  73: 'main.rs',
  56: 'Main.cs',
  72: 'main.rb',
  68: 'main.php',
  64: 'main.lua',
  81: 'Main.scala',
  61: 'Main.hs',
  82: 'query.sql',
  46: 'script.sh',
  83: 'main.swift',
  85: 'main.pl',
};

/**
 * Execute source code using Wandbox API
 */
async function executeWandbox(sourceCode, languageId, stdin = '') {
  const compiler = WANDBOX_COMPILERS[languageId];
  if (!compiler) {
    throw new Error(`Wandbox: Language ID ${languageId} is not supported.`);
  }

  const body = {
    compiler: compiler,
    code: sourceCode,
    stdin: stdin || '',
    save: false,
  };

  if (COMPILER_OPTIONS[compiler]) {
    body.compiler_option_raw = COMPILER_OPTIONS[compiler];
  }

  const { data } = await axios.post(WANDBOX_API, body, { timeout: 15000 });

  const stdout = data.program_output || '';
  const compileError = data.compiler_error || '';
  const runtimeError = data.program_error || '';
  const exitCode = parseInt(data.status ?? '0');

  const hasCompileError = compileError.trim().length > 0;
  const isSuccess = !hasCompileError && exitCode === 0;

  const finalStatus = isSuccess
    ? { id: 3, description: 'Accepted' }
    : {
        id: hasCompileError ? 6 : 11,
        description: hasCompileError ? 'Compilation Error' : 'Runtime Error',
      };

  const stderrOutput = hasCompileError
    ? compileError + (runtimeError ? '\n' + runtimeError : '')
    : runtimeError || null;

  return {
    stdout: stdout || null,
    stderr: stderrOutput || null,
    compile_output: compileError || null,
    status: finalStatus,
    time: null,
    memory: null,
    provider: 'wandbox',
  };
}

/**
 * Execute source code using Piston API
 */
async function executePiston(sourceCode, languageId, stdin = '') {
  const language = PISTON_LANGUAGES[languageId];
  if (!language) {
    throw new Error(`Piston: Language ID ${languageId} is not supported.`);
  }

  const filename = PISTON_LANG_FILES[languageId] || 'main.code';
  const body = {
    language: language,
    version: '*',
    files: [
      {
        name: filename,
        content: sourceCode,
      },
    ],
    stdin: stdin || '',
  };

  const { data } = await axios.post(PISTON_API, body, { timeout: 15000 });

  const run = data.run || {};
  const compile = data.compile || {};

  const stdout = run.stdout || '';
  const stderr = run.stderr || '';
  const compileStderr = compile.stderr || '';
  const exitCode = parseInt(run.code ?? '0');

  const hasCompileError = compileStderr.trim().length > 0;
  const isSuccess = !hasCompileError && exitCode === 0;

  const finalStatus = isSuccess
    ? { id: 3, description: 'Accepted' }
    : {
        id: hasCompileError ? 6 : 11,
        description: hasCompileError ? 'Compilation Error' : 'Runtime Error',
      };

  const stderrOutput = hasCompileError
    ? compileStderr + (stderr ? '\n' + stderr : '')
    : stderr || null;

  return {
    stdout: stdout || null,
    stderr: stderrOutput || null,
    compile_output: compileStderr || null,
    status: finalStatus,
    time: null,
    memory: null,
    provider: 'piston',
  };
}

/**
 * Main coordinated entry point with graceful fallback
 */
async function executeCode(sourceCode, languageId, stdin = '') {
  const primaryProvider = DEFAULT_PROVIDER === 'piston' ? 'piston' : 'wandbox';
  const fallbackProvider = primaryProvider === 'wandbox' ? 'piston' : 'wandbox';

  console.log(`[CodeExecution] Starting execution with primary provider: ${primaryProvider}`);

  try {
    if (primaryProvider === 'wandbox') {
      return await executeWandbox(sourceCode, languageId, stdin);
    } else {
      return await executePiston(sourceCode, languageId, stdin);
    }
  } catch (primaryErr) {
    console.error(
      `[CodeExecution Warning] Primary provider (${primaryProvider}) failed: ${primaryErr.message}`
    );

    if (IS_FALLBACK_ENABLED) {
      console.log(`[CodeExecution] Attempting failover to backup provider: ${fallbackProvider}`);
      try {
        if (fallbackProvider === 'wandbox') {
          return await executeWandbox(sourceCode, languageId, stdin);
        } else {
          return await executePiston(sourceCode, languageId, stdin);
        }
      } catch (fallbackErr) {
        throw new Error(
          `Code execution failed on both primary (${primaryProvider}) and fallback (${fallbackProvider}) providers.\n` +
            `Primary Error: ${primaryErr.message}\n` +
            `Fallback Error: ${fallbackErr.message}`
        );
      }
    } else {
      throw new Error(`Wandbox execution failed (fallback disabled): ${primaryErr.message}`);
    }
  }
}

module.exports = { executeCode };
