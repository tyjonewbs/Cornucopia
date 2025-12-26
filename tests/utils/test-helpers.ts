import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for Cornucopia E2E tests
 */

/**
 * Wait for page to be fully loaded including network idle
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Check if an element is visible on the page
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.isVisible();
  } catch {
    return false;
  }
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: Page, url?: string) {
  if (url) {
    await page.waitForURL(url);
  } else {
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Check console for errors (excluding known safe errors)
 */
export function setupConsoleErrorListener(page: Page) {
  const consoleErrors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out known safe errors (e.g., third-party script errors)
      if (!text.includes('Third party cookie') && 
          !text.includes('favicon.ico')) {
        consoleErrors.push(text);
      }
    }
  });
  
  return consoleErrors;
}

/**
 * Check for network request failures
 */
export function setupNetworkListener(page: Page) {
  const failedRequests: string[] = [];
  
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`);
  });
  
  return failedRequests;
}

/**
 * Fill form field and wait for it to be filled
 */
export async function fillFormField(page: Page, selector: string, value: string) {
  await page.locator(selector).fill(value);
  await expect(page.locator(selector)).toHaveValue(value);
}

/**
 * Click and wait for navigation
 */
export async function clickAndWaitForNavigation(page: Page, selector: string) {
  await Promise.all([
    page.waitForNavigation(),
    page.locator(selector).click(),
  ]);
}

/**
 * Scroll to element and ensure it's in viewport
 */
export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Check if page has specific meta tags
 */
export async function checkMetaTags(page: Page, expectedTags: Record<string, string>) {
  for (const [name, content] of Object.entries(expectedTags)) {
    const metaTag = page.locator(`meta[name="${name}"]`);
    await expect(metaTag).toHaveAttribute('content', content);
  }
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(page: Page, urlPattern: string | RegExp) {
  return await page.waitForResponse(urlPattern);
}

/**
 * Mock API response
 */
export async function mockAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: any
) {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Generate random test data
 */
export const generateTestData = {
  email: () => `test-${Date.now()}@example.com`,
  username: () => `testuser${Date.now()}`,
  password: () => `TestPass${Date.now()}!`,
  productName: () => `Test Product ${Date.now()}`,
  marketStandName: () => `Test Market Stand ${Date.now()}`,
  zipCode: () => String(Math.floor(10000 + Math.random() * 90000)),
};
