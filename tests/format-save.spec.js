// tests/format-save.spec.js
const { test, expect } = require('@playwright/test');

test('format on save', async ({ page }) => {
  await page.goto('/');

  // Wait for Monaco editor to be fully ready
  await page.waitForFunction(
    () => window.__DEBUGRA_EDITOR__ !== null && window.__DEBUGRA_EDITOR__ !== undefined
  );

  // Type unformatted code directly into the editor via the exposed global
  await page.evaluate(() => {
    const editor = window.__DEBUGRA_EDITOR__;
    editor.setValue('function foo(){console.log("hi")}');
    editor.focus();
  });

  // Small settle delay after setValue
  await page.waitForTimeout(200);

  // Trigger formatter directly via exposed global (avoids browser Ctrl+S interception)
  await page.evaluate(async () => {
    if (window.__debugra_formatEditor) {
      await window.__debugra_formatEditor();
    }
  });

  // Wait for prettier to finish — poll until semicolon appears
  await page.waitForFunction(
    () => {
      const editor = window.__DEBUGRA_EDITOR__;
      if (!editor) return false;
      const val = editor.getValue();
      return val.includes(';');
    },
    { timeout: 10000 }
  );

  // Read the formatted value
  const formattedCode = await page.evaluate(() => window.__DEBUGRA_EDITOR__.getValue());

  // Expect formatted output to include the original call and semicolon
  expect(formattedCode).toContain('console.log');
  expect(formattedCode).toContain(';');
});
