const axios = require('axios');

// Resolve Judge0 URL: if JUDGE0_API_URL points to rapidapi or placeholder key is used,
// use the open public Judge0 CE endpoint (https://ce.judge0.com/submissions?wait=true).
function getJudge0Config() {
  const envUrl = (process.env.JUDGE0_API_URL || '').trim();
  const apiKey = (process.env.JUDGE0_API_KEY || '').trim();
  const hasValidRapidKey = apiKey && apiKey !== 'your_rapidapi_key_here';

  if (envUrl.includes('rapidapi.com') && hasValidRapidKey) {
    return {
      url: `${envUrl}/submissions?wait=true`,
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
    };
  }

  // Default to open public Judge0 CE endpoint
  return {
    url: 'https://ce.judge0.com/submissions?wait=true',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Debugra-Server/1.0',
    },
  };
}

const WANDBOX_API = 'https://wandbox.org/api/compile.json';

const WANDBOX_COMPILERS = {
  71: 'cpython-3.13.8',      // Python
  63: 'nodejs-20.17.0',     // JavaScript
  80: 'typescript-5.6.2',   // TypeScript
  62: 'openjdk-jdk-21+35',  // Java
  54: 'gcc-13.2.0',         // C++
  55: 'gcc-13.2.0-c',       // C
  60: 'go-1.23.2',          // Go
  73: 'rust-1.82.0',        // Rust
  56: 'dotnetcore-8.0.402', // C#
  72: 'ruby-3.4.9',         // Ruby
  68: 'php-8.3.12',         // PHP
  64: 'lua-5.4.7',          // Lua
  81: 'scala-3.5.1',        // Scala
  61: 'ghc-9.10.1',         // Haskell
  82: 'sqlite-3.46.1',      // SQLite
  46: 'bash',               // Bash
  83: 'swift-6.0.1',        // Swift
  85: 'perl-5.40.0',        // Perl
};

const COMPILER_OPTIONS = {
  'gcc-13.2.0': '-std=c++17',
  'gcc-13.2.0-c': '-std=c11',
};

const MAX_OUTPUT_LENGTH = 100000;
const SUPPORTED_LANGUAGE_IDS = new Set(Object.keys(WANDBOX_COMPILERS).map(Number));

/**
 * Executes code using Judge0 CE with fallback to Wandbox.
 */
async function executeCode(sourceCode, languageId, stdin = '') {
  if (!SUPPORTED_LANGUAGE_IDS.has(Number(languageId))) {
    throw new Error(`Language ID ${languageId} is not supported. Try Python, JS, C++, Java, etc.`);
  }

  // 1. Try Judge0 CE first
  try {
    const judge0Config = getJudge0Config();
    const response = await axios.post(
      judge0Config.url,
      {
        source_code: sourceCode,
        language_id: Number(languageId),
        stdin: stdin || '',
      },
      {
        timeout: 15000,
        headers: judge0Config.headers,
      }
    );

    const data = response.data;
    if (data && data.status && data.status.id !== undefined) {
      const stdout = (data.stdout || '').slice(0, MAX_OUTPUT_LENGTH);
      const stderr = (data.stderr || data.compile_output || data.message || '').slice(0, MAX_OUTPUT_LENGTH);
      
      return {
        stdout: stdout || null,
        stderr: stderr || null,
        compile_output: data.compile_output || null,
        status: data.status,
        time: data.time || null,
        memory: data.memory || null,
      };
    }
  } catch (judge0Error) {
    console.warn(`[Execution] Judge0 CE call failed (${judge0Error.message}). Falling back to Wandbox...`);
  }

  // 2. Fallback to Wandbox if Judge0 is unreachable
  const compiler = WANDBOX_COMPILERS[languageId];
  try {
    let finalSourceCode = sourceCode;
    if (compiler === 'sqlite-3.46.1' && !finalSourceCode.includes('.mode')) {
      finalSourceCode = '.mode box\n' + finalSourceCode;
    }

    const body = {
      compiler: compiler,
      code: finalSourceCode,
      stdin: stdin || '',
      save: false,
    };

    if (COMPILER_OPTIONS[compiler]) {
      body.compiler_option_raw = COMPILER_OPTIONS[compiler];
    }

    const { data } = await axios.post(WANDBOX_API, body, { timeout: 15000 });

    const isWandboxRuntimeFailure =
      data.status === '126' || (data.compiler_error || '').includes('OCI runtime error');

    if (isWandboxRuntimeFailure) {
      throw new Error('Remote execution engine is currently undergoing maintenance. Please retry in a few moments.');
    }

    const stdout = (data.program_output || '').slice(0, MAX_OUTPUT_LENGTH);
    const compileError = (data.compiler_error || '').slice(0, MAX_OUTPUT_LENGTH);
    const runtimeError = (data.program_error || '').slice(0, MAX_OUTPUT_LENGTH);
    const exitCode = data.status != null ? parseInt(data.status, 10) : -1;

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
    };
  } catch (err) {
    throw new Error(`Code execution failed: ${err.message}`);
  }
}

module.exports = { executeCode, SUPPORTED_LANGUAGE_IDS };
