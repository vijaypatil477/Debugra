import { test, expect } from '@playwright/test';

test('imports a code file and sets the correct language and code content via the tab bar button', async ({
  page,
}) => {
  // Bypass the welcome tour
  await page.addInitScript(() => {
    localStorage.setItem('debugra_hasCompletedTour', 'true');
  });

  await page.goto('/editor');
  await page.waitForSelector('.monaco-editor');

  // Trigger file chooser using the tab bar import button
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page
    .locator('.editor-tab-bar')
    .getByRole('button', { name: /Import file/i })
    .click();
  const fileChooser = await fileChooserPromise;

  await fileChooser.setFiles({
    name: 'test_script.py',
    mimeType: 'text/x-python',
    buffer: Buffer.from('def hello_world():\n    print("hello from test script")\n'),
  });

  // Verify toast appears
  await expect(page.getByText('Imported test_script.py (detected Python 3)')).toBeVisible({
    timeout: 6000,
  });

  // Verify editor language selection has changed to Python 3
  const selectedLang = await page.locator('.lang-dropdown-trigger .lang-name').textContent();
  expect(selectedLang.trim()).toBe('Python 3');

  // Verify editor content has changed to the uploaded content
  const text = await page.evaluate(() => window.__DEBUGRA_EDITOR__?.getValue() ?? '');
  expect(text).toContain('def hello_world():');
  expect(text).toContain('print("hello from test script")');
});

test('imports an unknown file type and sets content as text without changing language via the tab bar button', async ({
  page,
}) => {
  // Bypass the welcome tour
  await page.addInitScript(() => {
    localStorage.setItem('debugra_hasCompletedTour', 'true');
  });

  await page.goto('/editor');
  await page.waitForSelector('.monaco-editor');

  // Set editor language to Javascript first
  await page.click('.lang-dropdown-trigger');
  await page.click('.lang-dropdown-item:has-text("JavaScript")');
  await page.waitForTimeout(200);

  // Trigger file chooser using the tab bar import button
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page
    .locator('.editor-tab-bar')
    .getByRole('button', { name: /Import file/i })
    .click();
  const fileChooser = await fileChooserPromise;

  await fileChooser.setFiles({
    name: 'data.xyz',
    mimeType: 'text/plain',
    buffer: Buffer.from('some custom formatted text data'),
  });

  // Verify toast appears
  await expect(page.getByText('Imported data.xyz as text')).toBeVisible({ timeout: 6000 });

  // Verify editor language selection is still Javascript
  const selectedLang = await page.locator('select.lang-select').first().inputValue();
  expect(selectedLang).toBe('javascript');

  // Verify editor content has changed to the uploaded content
  const text = await page.evaluate(() => window.__DEBUGRA_EDITOR__?.getValue() ?? '');
  expect(text).toBe('some custom formatted text data');
});
