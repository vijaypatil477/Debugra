import { test, expect } from '@playwright/test';

test('format on save', async ({ page, browserName }) => {
  await page.goto('/editor');
  await page.waitForSelector('.monaco-editor');

  // Ensure language is JavaScript so Prettier uses the JS parser
  await page.selectOption('select.lang-select', 'javascript');
  await page.waitForTimeout(200);

  // Seed unformatted code.
  await page.evaluate((code) => {
    const editor = window.__DEBUGRA_EDITOR__;
    editor.setValue(code);
  }, 'function foo(){console.log("hi")}');

  // Focus Monaco directly, then trigger the save shortcut the app listens for.
  await page.evaluate(() => {
    window.__DEBUGRA_EDITOR__?.focus();
  });
  await page.keyboard.press('Control+S');
  
  // Wait for the 'Formatted' toast to appear, ensuring Prettier finishes execution
  await expect(page.getByText('Formatted')).toBeVisible({ timeout: 6000 });

  // Read the editor content from Monaco's model so rendering quirks do not matter.
  const text = await page.evaluate(() => window.__DEBUGRA_EDITOR__?.getValue() ?? '');

  // Expect formatted output to include the original call and semicolon.
  expect(text).toContain('console.log');
  expect(text).toContain(';');
});
