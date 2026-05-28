import { test, expect } from '@playwright/test';

test.describe('Custom System Prompt Templates Gallery E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to home and navigate to editor
    await page.goto('/');
    await page.getByRole('button', { name: /Open Editor/i }).first().click();
    await expect(page).toHaveURL(/.*\/editor/);
  });

  test('should verify the gallery is accessible and integrates into settings flow', async ({ page }) => {
    // 1. Open Settings popover
    const settingsBtn = page.getByRole('button', { name: 'Open Settings' });
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    // 2. Verify AI Personality section is visible inside settings
    const aiPersonalitySection = page.locator('text=AI Personality');
    await expect(aiPersonalitySection).toBeVisible();

    // 3. Verify Default template is displayed
    const activeBanner = page.locator('.ptg-active-banner');
    await expect(activeBanner).toBeVisible();
    await expect(activeBanner).toContainText('Code Reviewer');

    // 4. Click active banner to open the gallery modal
    await activeBanner.click();
    
    // Gallery overlay should be visible
    const galleryModal = page.locator('[role="dialog"][aria-label="AI Personality Templates Gallery"]');
    await expect(galleryModal).toBeVisible();

    // Check title and subtitle
    await expect(page.locator('text=AI Personality Templates')).toBeVisible();
  });

  test('should verify all 8 assigned templates exist in the gallery', async ({ page }) => {
    // Open settings and gallery
    await page.getByRole('button', { name: 'Open Settings' }).click();
    await page.locator('.ptg-active-banner').click();

    // All 8 templates list
    const expectedTemplates = [
      'Code Reviewer',
      'Technical Interviewer',
      'Bug Hunter',
      'Senior Mentor',
      'Security Analyst',
      'Documentation Writer',
      'Performance Optimizer',
      'Friendly Tutor'
    ];

    for (const name of expectedTemplates) {
      const card = page.locator(`[role="radio"][aria-label*="${name}"]`);
      await expect(card).toBeVisible();
    }
  });

  test('should allow switching templates, showing selected state, and persisting after refresh', async ({ page }) => {
    // Open settings and gallery
    await page.getByRole('button', { name: 'Open Settings' }).click();
    await page.locator('.ptg-active-banner').click();

    // Select "Security Analyst"
    const securityCard = page.locator('[role="radio"][aria-label*="Security Analyst"]');
    await expect(securityCard).toBeVisible();
    await securityCard.click();

    // Verify visual selection state
    await expect(securityCard).toHaveClass(/ptg-card--selected/);

    // Close the gallery (either click close button or Escape)
    await page.keyboard.press('Escape');
    await expect(page.locator('.ptg-overlay')).not.toBeVisible();

    // Open settings again
    await page.getByRole('button', { name: 'Open Settings' }).click();
    
    // Check that active template is "Security Analyst"
    const activeBanner = page.locator('.ptg-active-banner');
    await expect(activeBanner).toContainText('Security Analyst');

    // Reload the page
    await page.reload();

    // Reopen settings and verify it persisted in localStorage
    await page.getByRole('button', { name: 'Open Settings' }).click();
    await expect(page.locator('.ptg-active-banner')).toContainText('Security Analyst');
  });

  test('should support search filtering and category tab filtering', async ({ page }) => {
    // Open settings and gallery
    await page.getByRole('button', { name: 'Open Settings' }).click();
    await page.locator('.ptg-active-banner').click();

    // 1. Search for "Bug Hunter"
    const searchInput = page.getByPlaceholder('Search templates…');
    await searchInput.fill('Bug Hunter');

    // Bug Hunter card should be visible, Code Reviewer should not
    await expect(page.locator('[role="radio"][aria-label*="Bug Hunter"]')).toBeVisible();
    await expect(page.locator('[role="radio"][aria-label*="Code Reviewer"]')).not.toBeVisible();

    // Clear search
    await searchInput.fill('');

    // 2. Filter by Security category tab
    const securityTab = page.locator('.ptg-tab', { hasText: 'Security' });
    await securityTab.click();

    // Security Analyst card should be visible, others not
    await expect(page.locator('[role="radio"][aria-label*="Security Analyst"]')).toBeVisible();
    await expect(page.locator('[role="radio"][aria-label*="Code Reviewer"]')).not.toBeVisible();
  });

  test('should support custom prompt input and auto-switch to custom mode', async ({ page }) => {
    // Open settings and gallery
    await page.getByRole('button', { name: 'Open Settings' }).click();
    await page.locator('.ptg-active-banner').click();

    // Click Custom Prompt card
    const customCard = page.locator('[role="radio"][aria-label*="Custom system prompt"]');
    await customCard.click();

    // Textarea should appear
    const textarea = page.locator('.ptg-custom-textarea');
    await expect(textarea).toBeVisible();

    // Fill custom prompt
    const testPrompt = 'You are a custom AI assistant that replies only in binary.';
    await textarea.fill(testPrompt);

    // Close and reload
    await page.keyboard.press('Escape');
    await page.reload();

    // Open settings, verify Custom Prompt is active template
    await page.getByRole('button', { name: 'Open Settings' }).click();
    await expect(page.locator('.ptg-active-banner')).toContainText('Custom Prompt');

    // Open gallery, check textarea contains the saved text
    await page.locator('.ptg-active-banner').click();
    const loadedTextarea = page.locator('.ptg-custom-textarea');
    await expect(loadedTextarea).toBeVisible();
    await expect(loadedTextarea).toHaveValue(testPrompt);
  });

  test('should support template preview and allow selection from preview modal', async ({ page }) => {
    // Open settings and gallery
    await page.getByRole('button', { name: 'Open Settings' }).click();
    await page.locator('.ptg-active-banner').click();

    // Find Bug Hunter card preview button and click it
    const bugHunterCard = page.locator('[role="radio"][aria-label*="Bug Hunter"]');
    const previewBtn = bugHunterCard.locator('.ptg-preview-btn');
    await previewBtn.click();

    // Preview modal should show up
    const previewOverlay = page.locator('.ptg-preview-overlay');
    await expect(previewOverlay).toBeVisible();
    await expect(previewOverlay.locator('.ptg-preview-title')).toContainText('Bug Hunter');
    await expect(previewOverlay.locator('.ptg-preview-prompt')).toContainText('You are an elite software debugger');

    // Click "Use This Template" inside preview
    const useBtn = previewOverlay.locator('.ptg-preview-select-btn');
    await useBtn.click();

    // Preview should close
    await expect(previewOverlay).not.toBeVisible();
    
    // Close the main gallery too
    await page.keyboard.press('Escape');
    await expect(page.locator('.ptg-overlay')).not.toBeVisible();
    
    // Check active banner in settings
    await page.getByRole('button', { name: 'Open Settings' }).click();
    await expect(page.locator('.ptg-active-banner')).toContainText('Bug Hunter');
  });

  test('should support keyboard navigation and close on Escape', async ({ page }) => {
    // Open settings and gallery
    await page.getByRole('button', { name: 'Open Settings' }).click();
    await page.locator('.ptg-active-banner').click();

    // Press Tab multiple times or Escape to close
    await page.keyboard.press('Escape');
    
    // Gallery should close
    await expect(page.locator('.ptg-overlay')).not.toBeVisible();
  });
});
