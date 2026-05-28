/**
 * downloadReport.js
 * Utility helpers for downloading AI explanation reports as Markdown or plain text.
 * All processing is client-side — uses the browser Blob + URL.createObjectURL API.
 */

/**
 * Returns an ISO-style timestamp string safe for use in filenames.
 * e.g. "2026-05-27_13-22"
 */
function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `_${pad(now.getHours())}-${pad(now.getMinutes())}`
  );
}

/**
 * Infers a short label for the report type from the response shape.
 * Used in the download filename.
 */
function inferReportType(response) {
  if (response.testCases) return 'tests';
  if (Array.isArray(response.steps)) return 'trace';
  if (response.fixedCode) return 'fix';
  if (response.explanation) return 'explanation';
  return 'report';
}

// ─── Markdown Builder ──────────────────────────────────────────────────────

/**
 * Converts an AI response object into a structured Markdown string.
 *
 * @param {object} response  - The parsed AI response (content payload).
 * @param {string} language  - Programming language name (e.g. "Python").
 * @param {object} [usage]   - Optional token usage stats from the API.
 * @returns {string} Full Markdown document.
 */
export function buildMarkdown(response, language = '', usage = null) {
  const ts = new Date().toLocaleString();
  const lang = language ? ` · ${language}` : '';
  const lines = [];

  lines.push(`# Debugra AI Report${lang}`);
  lines.push(`> Generated on ${ts}`);
  lines.push('');

  if (response.issue) {
    lines.push('## 🐛 Issue');
    lines.push(response.issue);
    lines.push('');
  }

  if (response.explanation) {
    lines.push('## 📖 Explanation');
    lines.push(response.explanation);
    lines.push('');
  }

  if (response.fix) {
    lines.push('## 🔧 Fix');
    lines.push(response.fix);
    lines.push('');
  }

  if (response.fixedCode) {
    const fence = language ? language.toLowerCase() : '';
    lines.push('## ✅ Fixed Code');
    lines.push('```' + fence);
    lines.push(response.fixedCode);
    lines.push('```');
    lines.push('');
  }

  if (Array.isArray(response.steps) && response.steps.length > 0) {
    lines.push(`## ⟡ Execution Trace (${response.steps.length} steps)`);
    lines.push('');
    response.steps.forEach((step, i) => {
      const isString = typeof step === 'string';
      const desc = isString
        ? step
        : step.description || step.explanation || step.action || '';
      const line = isString ? null : step.line;
      const code = isString ? null : step.code;
      const vars = isString ? null : step.variables;

      const lineLabel = line ? ` · Line ${line}` : '';
      lines.push(`### Step ${i + 1}${lineLabel}`);

      if (code) {
        const fence = language ? language.toLowerCase() : '';
        lines.push('```' + fence);
        lines.push(code);
        lines.push('```');
      }

      if (desc) lines.push(desc);

      if (vars) {
        const varStr =
          typeof vars === 'string'
            ? vars
            : Object.entries(vars)
                .map(([k, v]) => `\`${k} = ${JSON.stringify(v)}\``)
                .join(', ');
        lines.push(`**Variables:** ${varStr}`);
      }

      lines.push('');
    });
  }

  if (Array.isArray(response.testCases) && response.testCases.length > 0) {
    lines.push('## 🧪 Test Cases');
    lines.push('');
    lines.push('| # | Type | Input | Expected | Description |');
    lines.push('|---|------|-------|----------|-------------|');
    response.testCases.forEach((tc, i) => {
      const type = tc.type || 'normal';
      const input = String(tc.input ?? '').replace(/\|/g, '\\|');
      const expected = String(tc.expected ?? '').replace(/\|/g, '\\|');
      const desc = String(tc.description ?? '').replace(/\|/g, '\\|');
      lines.push(`| ${i + 1} | ${type} | \`${input}\` | \`${expected}\` | ${desc} |`);
    });
    lines.push('');
  }

  if (response.complexity || response.timeComplexity) {
    const time = response.complexity?.time || response.timeComplexity || 'N/A';
    const space = response.complexity?.space || response.spaceComplexity || 'N/A';
    lines.push('## ⚡ Complexity');
    lines.push(`- **Time:** \`${time}\``);
    lines.push(`- **Space:** \`${space}\``);
    lines.push('');
  }

  if (response.summary) {
    lines.push('## 📝 Summary');
    lines.push(response.summary);
    lines.push('');
  }

  if (response.bestPractice) {
    lines.push('## ✦ Best Practice');
    lines.push(response.bestPractice);
    lines.push('');
  }

  if (usage) {
    lines.push('---');
    lines.push('## 📊 Token Usage');
    lines.push(`- **Total tokens:** ${usage.total_tokens ?? 0}`);
    if (usage.prompt_tokens != null) lines.push(`- **Prompt tokens:** ${usage.prompt_tokens}`);
    if (usage.completion_tokens != null)
      lines.push(`- **Completion tokens:** ${usage.completion_tokens}`);
    const cost = ((usage.total_tokens ?? 0) * 0.0000005).toFixed(6);
    lines.push(`- **Estimated cost:** $${cost}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('*Report generated by [Debugra](https://debugra.vercel.app)*');

  return lines.join('\n');
}

// ─── Plain Text Builder ────────────────────────────────────────────────────

/**
 * Converts an AI response object into a plain-text string.
 *
 * @param {object} response  - The parsed AI response (content payload).
 * @param {string} language  - Programming language name (e.g. "Python").
 * @param {object} [usage]   - Optional token usage stats from the API.
 * @returns {string} Plain text document.
 */
export function buildPlainText(response, language = '', usage = null) {
  const ts = new Date().toLocaleString();
  const lang = language ? ` | ${language}` : '';
  const sep = '─'.repeat(60);
  const lines = [];

  lines.push(`DEBUGRA AI REPORT${lang}`);
  lines.push(`Generated: ${ts}`);
  lines.push(sep);

  if (response.issue) {
    lines.push('ISSUE');
    lines.push(response.issue);
    lines.push('');
  }

  if (response.explanation) {
    lines.push('EXPLANATION');
    lines.push(response.explanation);
    lines.push('');
  }

  if (response.fix) {
    lines.push('FIX');
    lines.push(response.fix);
    lines.push('');
  }

  if (response.fixedCode) {
    lines.push('FIXED CODE');
    lines.push(response.fixedCode);
    lines.push('');
  }

  if (Array.isArray(response.steps) && response.steps.length > 0) {
    lines.push(`EXECUTION TRACE (${response.steps.length} steps)`);
    response.steps.forEach((step, i) => {
      const isString = typeof step === 'string';
      const desc = isString
        ? step
        : step.description || step.explanation || step.action || '';
      const line = isString ? null : step.line;
      const code = isString ? null : step.code;
      const vars = isString ? null : step.variables;

      const lineLabel = line ? ` (Line ${line})` : '';
      lines.push(`  Step ${i + 1}${lineLabel}`);
      if (code) lines.push(`    Code: ${code}`);
      if (desc) lines.push(`    ${desc}`);
      if (vars) {
        const varStr =
          typeof vars === 'string'
            ? vars
            : Object.entries(vars)
                .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
                .join(', ');
        lines.push(`    Variables: ${varStr}`);
      }
    });
    lines.push('');
  }

  if (Array.isArray(response.testCases) && response.testCases.length > 0) {
    lines.push('TEST CASES');
    response.testCases.forEach((tc, i) => {
      lines.push(`  Test ${i + 1} [${tc.type || 'normal'}]`);
      lines.push(`    Input:    ${tc.input}`);
      lines.push(`    Expected: ${tc.expected}`);
      if (tc.description) lines.push(`    Note:     ${tc.description}`);
    });
    lines.push('');
  }

  if (response.complexity || response.timeComplexity) {
    const time = response.complexity?.time || response.timeComplexity || 'N/A';
    const space = response.complexity?.space || response.spaceComplexity || 'N/A';
    lines.push('COMPLEXITY');
    lines.push(`  Time:  ${time}`);
    lines.push(`  Space: ${space}`);
    lines.push('');
  }

  if (response.summary) {
    lines.push('SUMMARY');
    lines.push(response.summary);
    lines.push('');
  }

  if (response.bestPractice) {
    lines.push('BEST PRACTICE');
    lines.push(response.bestPractice);
    lines.push('');
  }

  if (usage) {
    lines.push(sep);
    lines.push('TOKEN USAGE');
    lines.push(`  Total tokens:     ${usage.total_tokens ?? 0}`);
    if (usage.prompt_tokens != null) lines.push(`  Prompt tokens:    ${usage.prompt_tokens}`);
    if (usage.completion_tokens != null)
      lines.push(`  Completion tokens: ${usage.completion_tokens}`);
    const cost = ((usage.total_tokens ?? 0) * 0.0000005).toFixed(6);
    lines.push(`  Estimated cost:   $${cost}`);
    lines.push('');
  }

  lines.push(sep);
  lines.push('Report generated by Debugra — https://debugra.vercel.app');

  return lines.join('\n');
}

// ─── Download Trigger ──────────────────────────────────────────────────────

/**
 * Triggers a browser download for the given text content.
 *
 * @param {string} content   - File text content.
 * @param {string} filename  - Target filename (including extension).
 * @param {string} mimeType  - MIME type, e.g. 'text/markdown' or 'text/plain'.
 */
export function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Public Download Helpers ───────────────────────────────────────────────

/**
 * Downloads the AI response as a Markdown file.
 *
 * @param {object} rawResponse - The full AI response object (may have `.content` + `.usage`).
 * @param {string} language    - Language name for the report header and code fences.
 */
export function downloadAsMarkdown(rawResponse, language = '') {
  const response = rawResponse?.content || rawResponse;
  const usage = rawResponse?.usage || null;
  const type = inferReportType(response);
  const ts = getTimestamp();
  const content = buildMarkdown(response, language, usage);
  triggerDownload(content, `debugra-${type}-${ts}.md`, 'text/markdown');
}

/**
 * Downloads the AI response as a plain text (.txt) file.
 *
 * @param {object} rawResponse - The full AI response object (may have `.content` + `.usage`).
 * @param {string} language    - Language name for the report header.
 */
export function downloadAsText(rawResponse, language = '') {
  const response = rawResponse?.content || rawResponse;
  const usage = rawResponse?.usage || null;
  const type = inferReportType(response);
  const ts = getTimestamp();
  const content = buildPlainText(response, language, usage);
  triggerDownload(content, `debugra-${type}-${ts}.txt`, 'text/plain');
}
