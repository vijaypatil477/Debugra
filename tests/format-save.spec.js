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
  await page.keyboard.type('function  foo(){console.log("hi") }');

  // Try both control and meta save sequences to trigger formatting
  // Try both control and meta save sequences to trigger formatting
  await page.keyboard.press('Control+S');
  await page.keyboard.press('Meta+S');

  // Wait briefly for the editor to process the save-format action
  // (formatting is performed in-page via Prettier dynamic imports).

  // Wait briefly for formatting to apply
  await page.waitForTimeout(800);

  // Read the editor content from the rendered view lines
  const text = await page.locator('.view-lines').innerText();
  // Expect the formatted code to include a semicolon after console.log
  expect(text).toContain('console.log');
  expect(text).toContain(';');
});
