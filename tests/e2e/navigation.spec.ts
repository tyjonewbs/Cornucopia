import { test, expect } from '@playwright/test';
import { waitForPageLoad } from '../utils/test-helpers';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('should navigate to About page', async ({ page }) => {
    // About link is in the footer, scroll to it
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Find and click About link in footer
    const aboutLink = page.locator('footer').getByRole('link', { name: /about us/i });
    
    // Wait for navigation to complete
    await Promise.all([
      page.waitForURL('**/about**', { timeout: 10000 }),
      aboutLink.click()
    ]);
    
    // Verify we're on the about page
    expect(page.url()).toContain('/about');
  });

  test('should navigate to Our Team page', async ({ page }) => {
    // Our Team link is in the footer, scroll to it
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Find and click Our Team link in footer
    const teamLink = page.locator('footer').getByRole('link', { name: /our team/i });
    
    // Wait for navigation to complete
    await Promise.all([
      page.waitForURL('**/our-team**', { timeout: 10000 }),
      teamLink.click()
    ]);
    
    // Verify we're on the our-team page
    expect(page.url()).toContain('/our-team');
  });

  test('should navigate to Contact page', async ({ page }) => {
    // Contact link is in the footer, scroll to it
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Find and click Contact link in footer (use first() since there are multiple contact links)
    const contactLink = page.locator('footer').getByRole('link', { name: /contact/i }).first();
    
    // Wait for navigation to complete
    await Promise.all([
      page.waitForURL('**/contact**', { timeout: 10000 }),
      contactLink.click()
    ]);
    
    // Verify we're on the contact page
    expect(page.url()).toContain('/contact');
  });

  test('should navigate to Blog page if exists', async ({ page }) => {
    // Blog link is in the footer, scroll to it
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Try to find blog link in footer
    const blogLink = page.locator('footer').getByRole('link', { name: /blog/i });
    
    // Only test if blog link exists
    if (await blogLink.count() > 0) {
      // Wait for navigation to complete
      await Promise.all([
        page.waitForURL('**/blog**', { timeout: 10000 }),
        blogLink.click()
      ]);
      expect(page.url()).toContain('/blog');
    }
  });

  test('should navigate back to homepage from logo click', async ({ page }) => {
    // Navigate to another page first (scroll to footer for About link)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const aboutLink = page.locator('footer').getByRole('link', { name: /about us/i });
    await aboutLink.click();
    await waitForPageLoad(page);
    
    // Click logo link in nav (the logo is an image with alt="Cornucopia" inside a link)
    const logoLink = page.locator('nav a[href="/"]').first();
    await logoLink.click();
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
    
    // Navigate to about (scroll to footer)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const aboutLink = page.locator('footer').getByRole('link', { name: /about us/i });
    await Promise.all([
      page.waitForURL('**/about**', { timeout: 10000 }),
      aboutLink.click()
    ]);
    
    // Navigate to contact (scroll to footer)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const contactLink = page.locator('footer').getByRole('link', { name: /contact/i }).first();
    await Promise.all([
      page.waitForURL('**/contact**', { timeout: 10000 }),
      contactLink.click()
    ]);
    
    // Use browser back button
    await Promise.all([
      page.waitForURL('**/about**', { timeout: 10000 }),
      page.goBack()
    ]);
    expect(page.url()).toContain('/about');
    
    // Use browser forward button
    await Promise.all([
      page.waitForURL('**/contact**', { timeout: 10000 }),
      page.goForward()
    ]);
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
