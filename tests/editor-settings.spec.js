import { test, expect } from '@playwright/test';

test('updates advanced editor settings instantly', async ({ page }) => {
  await page.goto('/editor');

  await page.getByRole('button', { name: /Open Settings/i }).click();

  await expect(page.getByText('Tab size')).toBeVisible();

  await page.getByLabel('Tab size').selectOption('2');
  await page.getByLabel('Minimap', { exact: true }).selectOption('disabled');
  await page.getByLabel('Vertical ruler').selectOption('120');

  const editorOptions = await page.evaluate(() => {
    const editor = window.__DEBUGRA_EDITOR__;
    if (!editor) return null;

    const options = editor.getRawOptions();
    const model = editor.getModel();

    return {
      tabSize: model?.getOptions().tabSize,
      minimapEnabled: options.minimap?.enabled,
      rulers: options.rulers,
    };
  });

  expect(editorOptions).not.toBeNull();
  expect(editorOptions.tabSize).toBe(2);
  expect(editorOptions.minimapEnabled).toBe(false);
  expect(editorOptions.rulers).toEqual([{ column: 120 }]);
});

test('inserts tabs using the selected indentation size', async ({ page }) => {
  await page.goto('/editor');

  await page.getByRole('button', { name: /Open Settings/i }).click();
  await page.getByLabel('Tab size').selectOption('2');

  await page.evaluate(() => {
    const editor = window.__DEBUGRA_EDITOR__;
    editor.setValue('');
    editor.setPosition({ lineNumber: 1, column: 1 });
    editor.focus();
  });

  await page.keyboard.press('Tab');

  const value = await page.evaluate(() => window.__DEBUGRA_EDITOR__.getValue());
  expect(value).toBe('  ');
});

test('restores autosaved drafts after reload', async ({ page }) => {
  await page.goto('/editor');

  await page.getByRole('button', { name: /Open Settings/i }).click();
  await page.getByLabel('Autosave interval').selectOption('5000');

  const draftCode = "print('autosave works')";
  await page.evaluate((code) => {
    const editor = window.__DEBUGRA_EDITOR__;
    editor.setValue(code);
  }, draftCode);

  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem('debugra-editor-draft')), {
      timeout: 8000,
    })
    .not.toBeNull();

  await page.reload();

  await expect
    .poll(async () => page.evaluate(() => window.__DEBUGRA_EDITOR__?.getValue()), { timeout: 8000 })
    .toContain(draftCode);
});

test('hides the editor divider when minimap is disabled', async ({ page }) => {
  await page.goto('/editor');

  await page.getByRole('button', { name: /Open Settings/i }).click();
  await page.getByLabel('Minimap', { exact: true }).selectOption('disabled');

  const minimapStyle = await page.evaluate(() => {
    const minimap = document.querySelector('.monaco-editor .minimap');
    const ruler = document.querySelector('.monaco-editor .decorationsOverviewRuler');

    return {
      minimapDisplay: minimap ? getComputedStyle(minimap).display : null,
      rulerDisplay: ruler ? getComputedStyle(ruler).display : null,
      minimapWidth: minimap ? getComputedStyle(minimap).width : null,
    };
  });

  expect(minimapStyle.minimapDisplay).toBe('none');
  expect(minimapStyle.rulerDisplay).toBe('none');
  expect(minimapStyle.minimapWidth).toBe('0px');
});
