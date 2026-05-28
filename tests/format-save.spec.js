import { test, expect } from '@playwright/test';

test('format on save', async ({ page, browserName }) => {
  await page.goto('/editor');
  await page.waitForSelector('.monaco-editor');

  // Ensure language is JavaScript so Prettier uses the JS parser
  await page.selectOption('select.lang-select', 'javascript');
  await page.waitForTimeout(200);

  // Seed unformatted code and invoke the formatter helper directly.
  await page.evaluate((code) => {
    window.__DEBUGRA_EDITOR__.setValue(code);
  }, 'function  foo(){console.log("hi") }');

  await page.evaluate(async () => {
    if (window.__debugra_formatEditor) {
      await window.__debugra_formatEditor();
    }
  });

  // Read the editor content from Monaco's model.
  const text = await page.evaluate(() => window.__DEBUGRA_EDITOR__.getValue());

  // Expect the formatted code to include a semicolon after console.log.
  expect(text).toContain('console.log');
  expect(text).toContain(';');
});
