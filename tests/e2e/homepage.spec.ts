import { test, expect } from '@playwright/test';
import { waitForPageLoad, setupConsoleErrorListener, setupNetworkListener } from '../utils/test-helpers';

test.describe('Homepage Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Cornucopia/i);
    
    // Verify URL is correct
    expect(page.url()).toContain('/');
  });

  test('should display header/navbar', async ({ page }) => {
    // Check for navigation elements
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
    
    // Check for logo or brand name
    const logo = page.locator('nav').getByText(/Cornucopia/i).first();
    await expect(logo).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer exists
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should have no console errors', async ({ page }) => {
    const consoleErrors = setupConsoleErrorListener(page);
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Wait a bit for any delayed errors
    await page.waitForTimeout(2000);
    
    // Check that no critical errors occurred
    expect(consoleErrors.length).toBe(0);
  });

  test('should have no failed network requests', async ({ page }) => {
    const failedRequests = setupNetworkListener(page);
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Check for failed requests
    expect(failedRequests.length).toBe(0);
  });

  test('should display main content sections', async ({ page }) => {
    // Check for main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should be responsive - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Check that page is still usable
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should be responsive - tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Check that page is still usable
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should load without JavaScript errors in production mode', async ({ page }) => {
    // Track JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await waitForPageLoad(page);
    
    expect(errors.length).toBe(0);
  });
});
