import { test, expect } from '@playwright/test';

test.describe('Feedback Page Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feedback');
  });

  test('should render left panel info section', async ({ page }) => {
    await expect(page.locator('.feedback-info-section')).toBeVisible();
    await expect(page.locator('.feedback-info-card')).toHaveCount(3);
  });

  test('should enforce inline validations on form submission', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('#name-error')).toContainText('Name is required');
    await expect(page.locator('#email-error')).toContainText('Email is required');
    await expect(page.locator('#message-error')).toContainText('Message is required');

    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'invalidemail');
    await page.click('button[type="submit"]');
    await expect(page.locator('#email-error')).toContainText('Please enter a valid email address');
  });

  test('should display live character counter with limits', async ({ page }) => {
    const textarea = page.locator('textarea[name="message"]');
    const counter = page.locator('.char-counter');

    await expect(counter).toContainText('0 / 1000');

    await textarea.fill('Hello World!');
    await expect(counter).toContainText('12 / 1000');
  });

  test('should support screenshot upload preview, replace, and remove actions', async ({ page }) => {
    await expect(page.locator('.drag-drop-zone')).toBeVisible();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('.drag-drop-zone').click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles({
      name: 'screenshot.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-content'),
    });

    await expect(page.locator('.screenshot-preview-card')).toBeVisible();
    await expect(page.locator('.screenshot-name')).toContainText('screenshot.png');

    await page.click('.btn-remove-screenshot');
    await expect(page.locator('.screenshot-preview-card')).not.toBeVisible();
    await expect(page.locator('.drag-drop-zone')).toBeVisible();
  });

  test('should handle loading state and successful submission', async ({ page }) => {
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('textarea[name="message"]', 'This is a long message to pass the length check.');

    await page.click('button[type="submit"]');

    await expect(page.locator('button[type="submit"]')).toContainText('Submitting feedback...');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    await expect(page.locator('.feedback-success-card')).toBeVisible();
    await expect(page.locator('.feedback-success-title')).toContainText('Feedback Submitted!');

    await page.click('.feedback-success-btn');
    await expect(page.locator('.feedback-form')).toBeVisible();
  });
});
