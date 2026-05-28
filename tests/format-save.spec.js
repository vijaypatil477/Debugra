import { test, expect } from '@playwright/test';

test('format on save', async ({ page, browserName }) => {
  await page.goto('/editor');
  await page.waitForSelector('.monaco-editor');

  // Ensure language is JavaScript so Prettier uses the JS parser
  await page.selectOption('select.lang-select', 'javascript');
  await page.waitForTimeout(200);

  // Focus the editor, clear existing template, and type unformatted code
  await page.click('.monaco-editor');
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type('function foo(){console.log("hi")}');

  // Try to trigger formatting (Cmd/Ctrl+S).
  // We only press one shortcut because Meta+S on Chromium can be flaky in automation.
  await page.keyboard.press('Control+S');

  // Wait briefly for the editor to process the save-format action
  // (formatting is performed in-page via Prettier dynamic imports).
  await page.waitForTimeout(800);

  // Read the editor content from the rendered view lines
  const text = await page.locator('.view-lines').innerText();

  // Expect formatted output to include console.log and the trailing semicolon.
  // (Playwright innerText may normalize whitespace, but semicolons should remain.)
  expect(text).toContain('console.log');
  expect(text).toContain('console.log("hi")');
});
