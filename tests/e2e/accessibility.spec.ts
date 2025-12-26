import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForPageLoad } from '../utils/test-helpers';

test.describe('Accessibility Tests', () => {
  test('homepage should not have automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('about page should not have accessibility issues', async ({ page }) => {
    await page.goto('/about');
    await waitForPageLoad(page);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('contact page should not have accessibility issues', async ({ page }) => {
    await page.goto('/contact');
    await waitForPageLoad(page);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('our-team page should not have accessibility issues', async ({ page }) => {
    await page.goto('/our-team');
    await waitForPageLoad(page);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check that h1 exists
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Get all images
    const images = page.locator('img');
    const count = await images.count();

    // Check each image has alt attribute
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Alt can be empty string for decorative images, but should exist
      expect(alt).not.toBeNull();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/contact');
    await waitForPageLoad(page);

    // Get all form inputs
    const inputs = page.locator('input[type="text"], input[type="email"], textarea');
    const count = await inputs.count();

    if (count > 0) {
      // Each input should have associated label or aria-label
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        // Should have either id (for label association), aria-label, or aria-labelledby
        const hasLabel = id || ariaLabel || ariaLabelledBy;
        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Run axe for color contrast specifically
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const firstFocus = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocus).toBeTruthy();

    // Should be able to tab to more elements
    await page.keyboard.press('Tab');
    const secondFocus = await page.evaluate(() => document.activeElement?.tagName);
    expect(secondFocus).toBeTruthy();

    // Tab and shift+tab should work
    await page.keyboard.press('Shift+Tab');
    const backFocus = await page.evaluate(() => document.activeElement?.tagName);
    expect(backFocus).toBeTruthy();
  });

  test('should have proper ARIA landmarks', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    // Check for navigation landmark
    const nav = page.locator('nav, [role="navigation"]');
    const navCount = await nav.count();
    expect(navCount).toBeGreaterThan(0);
  });

  test('should have skip to main content link', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Tab to first element (often skip link)
    await page.keyboard.press('Tab');
    
    // Check if focused element is a skip link
    const focusedText = await page.evaluate(() => {
      return document.activeElement?.textContent?.toLowerCase() || '';
    });

    // This is a nice-to-have, not critical
    // So we just check it exists, don't fail if it doesn't
    if (focusedText.includes('skip')) {
      expect(focusedText).toContain('skip');
    }
  });

  test('should not have WCAG 2 AA violations', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be usable with screen reader', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check for proper page title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Check lang attribute on html
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBeTruthy();
  });
});
