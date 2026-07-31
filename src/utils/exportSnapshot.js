// src/utils/exportSnapshot.js
// Client-side export helpers for Debugra Editor.
// Creates a printable/exportable DOM representation of:
// - code (with token-based syntax highlighting via highlight.js)
// - execution output (stdout/stderr/AI response if available)
// Then exports it as PNG or PDF.

import hljs from 'highlight.js/lib/core';

// Import only common grammars. If the app's language list expands,
// we can add more mappings.
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import csharp from 'highlight.js/lib/languages/csharp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';
import swift from 'highlight.js/lib/languages/swift';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c++', cpp);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('php', php);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('sql', sql);

function safeText(v) {
  if (v == null) return '';
  return String(v);
}

function escapeHtml(str) {
  return safeText(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function formatTimestamp(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
    d.getHours()
  )}-${pad(d.getMinutes())}`;
}

function languageToHljs(lang) {
  const l = (lang || '').toLowerCase();
  if (!l) return undefined;
  if (l === 'javascript') return 'javascript';
  if (l === 'typescript') return 'typescript';
  if (l === 'python') return 'python';
  if (l === 'java') return 'java';
  if (l === 'c') return 'c';
  if (l === 'cpp' || l === 'c++') return 'cpp';
  if (l === 'csharp' || l === 'cs') return 'csharp';
  if (l === 'go' || l === 'golang') return 'go';
  if (l === 'rust') return 'rust';
  if (l === 'ruby') return 'ruby';
  if (l === 'php') return 'php';
  if (l === 'swift') return 'swift';
  if (l === 'bash' || l === 'sh') return 'bash';
  if (l === 'sql') return 'sql';

  // Fallback: highlight.js will attempt auto-detection.
  return undefined;
}

function buildExportHtml({
  title,
  language,
  theme,
  code,
  outputLabel,
  stdout,
  stderr,
  aiResponse,
  includeOutput,
  outputKind,
  fontFamily,
  fontSizePx,
}) {
  const langForHljs = languageToHljs(language);

  const codeEscaped = escapeHtml(code || '');

  // We'll render code via highlight.js into <pre><code>.
  // For deterministic export, we inject a minimal highlight style
  // that works with highlight.js token classes.
  // (We also add our own colors for background/foreground.)
  const baseBg = theme === 'light' ? '#f5f7fa' : '#1e1e1e';
  const baseText = theme === 'light' ? '#0f172a' : '#d4d4d4';
  const mutedText = theme === 'light' ? '#475569' : '#9d9d9d';

  const stdoutText = safeText(stdout);
  const stderrText = safeText(stderr);
  const aiText = safeText(aiResponse);

  const outputHtml = includeOutput
    ? (() => {
        const block = (label, value, colorClass) => {
          if (!value) return '';
          return `
            <div class="export-output-block ${colorClass}">
              <div class="export-output-block__label">${escapeHtml(label)}</div>
              <pre class="export-output-block__pre">${escapeHtml(value)}</pre>
            </div>
          `;
        };

        if (outputKind === 'stdout') {
          return block('stdout', stdoutText, 'is-stdout');
        }
        if (outputKind === 'stderr') {
          return block('stderr', stderrText, 'is-stderr');
        }
        if (outputKind === 'ai') {
          return block('AI', aiText, 'is-ai');
        }

        // fallback: include what exists
        return [
          block('stdout', stdoutText, 'is-stdout'),
          block('stderr', stderrText, 'is-stderr'),
          block('AI', aiText, 'is-ai'),
        ].join('');
      })()
    : '';

  const hljsThemeVars = theme === 'light'
    ? {
        keyword: '#7c3aed',
        string: '#0e7490',
        number: '#b45309',
        function: '#2563eb',
        comment: '#64748b',
        type: '#0f766e',
        operator: '#334155',
      }
    : {
        keyword: '#569cd6',
        string: '#ce9178',
        number: '#b5cea8',
        function: '#dcdcaa',
        comment: '#6a9955',
        type: '#4ec9b0',
        operator: '#d4d4d4',
      };

  // Minimal token styling by targeting highlight.js common tokens.
  const highlightCss = `
    .export-code pre { margin: 0; }
    .hljs { background: transparent !important; color: ${baseText} !important; }
    .export-code code {
      font-family: ${escapeHtml(fontFamily || 'JetBrains Mono')};
      font-size: ${Number(fontSizePx || 13)}px;
      line-height: 1.7;
    }

    .export-code .hljs-comment,
    .export-code .hljs-quote { color: ${hljsThemeVars.comment} !important; font-style: italic; }

    .export-code .hljs-keyword,
    .export-code .hljs-selector-tag,
    .export-code .hljs-literal,
    .export-code .hljs-symbol { color: ${hljsThemeVars.keyword} !important; font-weight: 600; }

    .export-code .hljs-string,
    .export-code .hljs-bullet,
    .export-code .hljs-title,
    .export-code .hljs-name,
    .export-code .hljs-params { color: ${hljsThemeVars.string} !important; }

    .export-code .hljs-number,
    .export-code .hljs-variable { color: ${hljsThemeVars.number} !important; }

    .export-code .hljs-function,
    .export-code .hljs-class .hljs-title { color: ${hljsThemeVars.function} !important; }

    .export-code .hljs-type { color: ${hljsThemeVars.type} !important; }

    .export-code .hljs-operator,
    .export-code .hljs-attr,
    .export-code .hljs-attribute,
    .export-code .hljs-built_in,
    .export-code .hljs-builtin-name { color: ${hljsThemeVars.operator} !important; }
  `;

  const ts = formatTimestamp();

  return {
    ts,
    langForHljs,
    baseBg,
    baseText,
    mutedText,
    highlightCss,
    html: `
      <div class="export-root export-theme-${escapeHtml(theme)}">
        <div class="export-card">
          <div class="export-card__border" aria-hidden="true"></div>

          <div class="export-header">
            <div class="export-title-row">
              <div class="export-title">${escapeHtml(title || 'Debugra Export')}</div>
              <div class="export-meta">
                <span class="export-meta__chip">${escapeHtml(language || '') || 'Text'}</span>
                <span class="export-meta__dot">•</span>
                <span class="export-meta__chip">${escapeHtml(theme || '')}</span>
                <span class="export-meta__dot">•</span>
                <span class="export-meta__text">${escapeHtml(ts)}</span>
              </div>
            </div>
          </div>

          <div class="export-body">
            <div class="export-code">
              <pre><code class="language-${escapeHtml(langForHljs || 'plaintext')}" data-highlight>
                ${codeEscaped}
              </code></pre>
            </div>

            ${includeOutput ? `
              <div class="export-output">
                <div class="export-output__header">
                  <span class="export-output__header-label">${escapeHtml(outputLabel || 'Output')}</span>
                  <span class="export-output__header-sub">${escapeHtml(
                    outputKind ? outputKind.toUpperCase() : 'LOGS'
                  )}</span>
                </div>
                <div class="export-output__content">
                  ${outputHtml || `<div class="export-output__empty">No output available.</div>`}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <style>
          ${highlightCss}

          .export-root {
            width: 100%;
            color: ${baseText};
            font-family: ${escapeHtml(fontFamily || 'JetBrains Mono')}, monospace;
          }

          .export-card {
            position: relative;
            border-radius: 18px;
            overflow: hidden;
            background: ${baseBg};
            padding: 18px;
          }

          .export-card__border {
            position: absolute;
            inset: -2px;
            background: linear-gradient(135deg, rgba(0,120,212,0.55), rgba(78,201,176,0.45), rgba(139,92,246,0.45));
            filter: blur(0px);
            opacity: 0.55;
            z-index: 0;
          }

          .export-header, .export-body { position: relative; z-index: 1; }

          .export-header {
            margin-bottom: 14px;
          }

          .export-title-row {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }

          .export-title {
            font-family: 'Inter', system-ui, sans-serif;
            font-weight: 800;
            letter-spacing: -0.02em;
            font-size: 1.0rem;
            color: ${baseText};
          }

          .export-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .export-meta__chip {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.72rem;
            padding: 3px 8px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            color: ${mutedText};
          }

          .export-meta__dot {
            color: rgba(255,255,255,0.35);
            font-size: 0.75rem;
          }

          .export-meta__text {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.72rem;
            color: ${mutedText};
          }

          .export-body {
            display: flex;
            gap: 14px;
            align-items: flex-start;
          }

          .export-code {
            flex: 1;
            min-width: 520px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.02);
            padding: 14px;
          }

          .export-code pre {
            margin: 0;
            overflow: hidden;
          }

          .export-output {
            width: 420px;
            max-width: 420px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.02);
            padding: 12px 12px;
          }

          .export-output__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 8px;
          }

          .export-output__header-label {
            font-family: 'Inter', system-ui, sans-serif;
            font-weight: 800;
            font-size: 0.85rem;
            color: ${baseText};
          }

          .export-output__header-sub {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.7rem;
            color: ${mutedText};
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
            padding: 2px 7px;
            border-radius: 999px;
            white-space: nowrap;
          }

          .export-output__content {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .export-output__empty {
            color: ${mutedText};
            font-size: 0.75rem;
            font-family: 'Inter', system-ui, sans-serif;
            padding: 12px 6px;
          }

          .export-output-block {
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(0,0,0,0.10);
            overflow: hidden;
          }

          .export-output-block__label {
            font-family: 'Inter', system-ui, sans-serif;
            font-weight: 700;
            font-size: 0.72rem;
            color: ${mutedText};
            padding: 8px 10px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }

          .export-output-block__pre {
            margin: 0;
            padding: 10px 10px;
            font-size: ${Number(fontSizePx || 13)}px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: ${escapeHtml(fontFamily || 'JetBrains Mono')}, monospace;
            color: ${baseText};
          }

          .export-output-block.is-stderr .export-output-block__label { color: #f87171; }
          .export-output-block.is-stderr .export-output-block__pre { color: #ff8080; }

          .export-output-block.is-stdout .export-output-block__label { color: #4ec9b0; }
          .export-output-block.is-stdout .export-output-block__pre { color: ${baseText}; }

          .export-output-block.is-ai .export-output-block__label { color: ${theme === 'light' ? '#4f46e5' : '#a78bfa'}; }
        </style>
      </div>
    `,
  };
}

async function ensureFontsReady() {
  try {
    if (document?.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {
    // ignore
  }
}

export async function exportEditorAsPng({
  editor,
  execution,
  theme,
  filenameBase = 'debugra-export',
  includeOutput = true,
  outputKind,
  toast,
}) {
  const { code, language, fontFamily, fontSizePx } = editor;
  const stdout = execution?.stdout;
  const stderr = execution?.stderr;
  const aiResponse = execution?.aiResponse;

  const title = 'Debugra Code Export';

  const mount = document.createElement('div');
  mount.style.position = 'fixed';
  mount.style.left = '-10000px';
  mount.style.top = '0';
  mount.style.width = '1400px';
  mount.style.pointerEvents = 'none';
  mount.style.zIndex = '-1';

  document.body.appendChild(mount);

  try {
    const snapshot = buildExportHtml({
      title,
      language,
      theme,
      code,
      outputLabel: 'Execution Output',
      stdout,
      stderr,
      aiResponse,
      includeOutput,
      outputKind,
      fontFamily,
      fontSizePx,
    });

    mount.innerHTML = snapshot.html;

    // Run highlight.js on the injected code element.
    const codeEl = mount.querySelector('code[data-highlight]');
    if (codeEl) {
      const raw = code || '';
      const lang = snapshot.langForHljs;
      const result = lang ? hljs.highlight(raw, { language: lang }).value : hljs.highlightAuto(raw).value;
      codeEl.innerHTML = result;
    }

    await ensureFontsReady();

    const { default: html2canvas } = await import('html2canvas');

    const exportEl = mount.querySelector('.export-root');
    if (!exportEl) throw new Error('Export element not found');

    const scale = 3; // high-res
    const canvas = await html2canvas(exportEl, {
      backgroundColor: null,
      scale,
      useCORS: true,
      logging: false,
      // Ensure the full element is captured
      scrollX: 0,
      scrollY: 0,
      windowWidth: exportEl.scrollWidth,
      windowHeight: exportEl.scrollHeight,
    });

    const dataUrl = canvas.toDataURL('image/png');
    const blob = await (await fetch(dataUrl)).blob();

    const ts = formatTimestamp();
    const filename = `${filenameBase}-${outputKind || 'code'}-${ts}.png`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast?.success?.('Exported PNG');
  } catch (e) {
    console.error(e);
    toast?.error?.('Export PNG failed');
    throw e;
  } finally {
    mount.remove();
  }
}

export async function exportEditorAsPdf({
  editor,
  execution,
  theme,
  filenameBase = 'debugra-export',
  includeOutput = true,
  outputKind,
  toast,
}) {
  const { code, language, fontFamily, fontSizePx } = editor;
  const stdout = execution?.stdout;
  const stderr = execution?.stderr;
  const aiResponse = execution?.aiResponse;

  const title = 'Debugra Code Export';

  const mount = document.createElement('div');
  mount.style.position = 'fixed';
  mount.style.left = '-10000px';
  mount.style.top = '0';
  mount.style.width = '1400px';
  mount.style.pointerEvents = 'none';
  mount.style.zIndex = '-1';

  document.body.appendChild(mount);

  try {
    const snapshot = buildExportHtml({
      title,
      language,
      theme,
      code,
      outputLabel: 'Execution Output',
      stdout,
      stderr,
      aiResponse,
      includeOutput,
      outputKind,
      fontFamily,
      fontSizePx,
    });

    mount.innerHTML = snapshot.html;

    const codeEl = mount.querySelector('code[data-highlight]');
    if (codeEl) {
      const raw = code || '';
      const lang = snapshot.langForHljs;
      const result = lang ? hljs.highlight(raw, { language: lang }).value : hljs.highlightAuto(raw).value;
      codeEl.innerHTML = result;
    }

    await ensureFontsReady();

    // Use html2pdf.js for simplicity (HTML->canvas->PDF).
    const html2pdf = (await import('html2pdf.js')).default;

    const exportEl = mount.querySelector('.export-root');
    if (!exportEl) throw new Error('Export element not found');

    const ts = formatTimestamp();
    const filename = `${filenameBase}-${outputKind || 'code'}-${ts}.pdf`;

    await html2pdf()
      .from(exportEl)
      .set({
        margin: 0.2,
        filename,
        image: { type: 'png', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      })
      .save();

    toast?.success?.('Exported PDF');
  } catch (e) {
    console.error(e);
    toast?.error?.('Export PDF failed');
    throw e;
  } finally {
    mount.remove();
  }
}

