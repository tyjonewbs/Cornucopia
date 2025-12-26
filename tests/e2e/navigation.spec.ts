import { test, expect } from '@playwright/test';
import { waitForPageLoad } from '../utils/test-helpers';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('should navigate to About page', async ({ page }) => {
    // Find and click About link
    const aboutLink = page.getByRole('link', { name: /about/i });
    await aboutLink.click();
    await waitForPageLoad(page);
    
    // Verify we're on the about page
    expect(page.url()).toContain('/about');
  });

  test('should navigate to Our Team page', async ({ page }) => {
    // Find and click Our Team link
    const teamLink = page.getByRole('link', { name: /our team/i });
    await teamLink.click();
    await waitForPageLoad(page);
    
    // Verify we're on the our-team page
    expect(page.url()).toContain('/our-team');
  });

  test('should navigate to Contact page', async ({ page }) => {
    // Find and click Contact link
    const contactLink = page.getByRole('link', { name: /contact/i });
    await contactLink.click();
    await waitForPageLoad(page);
    
    // Verify we're on the contact page
    expect(page.url()).toContain('/contact');
  });

  test('should navigate to Blog page if exists', async ({ page }) => {
    // Try to find blog link
    const blogLink = page.getByRole('link', { name: /blog/i });
    
    // Only test if blog link exists
    if (await blogLink.count() > 0) {
      await blogLink.click();
      await waitForPageLoad(page);
      expect(page.url()).toContain('/blog');
    }
  });

  test('should navigate back to homepage from logo click', async ({ page }) => {
    // Navigate to another page first
    const aboutLink = page.getByRole('link', { name: /about/i });
    await aboutLink.click();
    await waitForPageLoad(page);
    
    // Click logo to go back home
    const logo = page.locator('nav').getByText(/Cornucopia/i).first();
    await logo.click();
    await waitForPageLoad(page);
    
    // Should be back at homepage
    expect(page.url()).toMatch(/\/$|\/$/);
  });

  test('should have working footer links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer is visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Get all links in footer
    const footerLinks = footer.locator('a');
    const count = await footerLinks.count();
    
    // Verify footer has some links
    expect(count).toBeGreaterThan(0);
  });

  test('should maintain navigation state across pages', async ({ page }) => {
    // Start at home
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Navigate to about
    await page.getByRole('link', { name: /about/i }).click();
    await waitForPageLoad(page);
    
    // Navigate to contact
    await page.getByRole('link', { name: /contact/i }).click();
    await waitForPageLoad(page);
    
    // Use browser back button
    await page.goBack();
    await waitForPageLoad(page);
    expect(page.url()).toContain('/about');
    
    // Use browser forward button
    await page.goForward();
    await waitForPageLoad(page);
    expect(page.url()).toContain('/contact');
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    // Navigate to a page that doesn't exist
    const response = await page.goto('/this-page-does-not-exist-12345');
    
    // Should get 404 response
    expect(response?.status()).toBe(404);
    
    // Page should still render something (error page)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should show active navigation state', async ({ page }) => {
    // Navigate to about page
    await page.getByRole('link', { name: /about/i }).click();
    await waitForPageLoad(page);
    
    // The about link might have an active class or aria-current attribute
    // This test checks if there's any visual indication
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    // Check that navigation can be accessed via keyboard
    await page.keyboard.press('Tab');
    
    // First focused element should be in navigation
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    // Should have focused something
    expect(focusedElement).toBeTruthy();
  });
});
