# Testing Guide for Cornucopia

This document provides comprehensive information about automated testing setup for the Cornucopia marketplace application.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [AI-Powered Testing](#ai-powered-testing)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Cornucopia uses **Playwright** as its end-to-end testing framework, providing:

- ✅ Cross-browser testing (Chromium, Firefox, WebKit)
- ✅ API testing capabilities
- ✅ Accessibility testing with @axe-core/playwright
- ✅ Visual regression testing
- ✅ Mobile viewport testing
- ✅ AI-assisted test generation and maintenance

## Getting Started

### Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn package manager

### Installation

The testing dependencies are already installed. If you need to reinstall:

```bash
npm install
npx playwright install chromium
```

## Running Tests

### Basic Commands

```bash
# Run all tests in headless mode
npm test

# Run tests with UI mode (recommended for development)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug

# View HTML test report
npm run test:report
```

### Selective Test Execution

```bash
# Run only E2E tests
npm run test:e2e

# Run only API tests
npm run test:api

# Run only accessibility tests
npm run test:accessibility

# Run specific test file
npx playwright test tests/e2e/homepage.spec.ts

# Run tests matching a pattern
npx playwright test --grep "homepage"
```

### Interactive Test Generation

Playwright Codegen allows you to record your actions and generate test code:

```bash
npm run test:codegen
```

This will:
1. Open a browser and Playwright Inspector
2. Record your actions as you navigate the site
3. Generate test code automatically

## Test Structure

```
tests/
├── e2e/                      # End-to-end tests
│   ├── homepage.spec.ts      # Homepage functionality
│   ├── navigation.spec.ts    # Navigation and routing
│   └── accessibility.spec.ts # WCAG compliance tests
├── api/                      # API endpoint tests
│   └── health.spec.ts        # API health and performance
└── utils/                    # Test utilities
    └── test-helpers.ts       # Reusable helper functions
```

### Test Coverage

Current test suites cover:

1. **Homepage Tests** (`homepage.spec.ts`)
   - Page loading and rendering
   - Header/navbar visibility
   - Footer visibility
   - Console error detection
   - Network request monitoring
   - Responsive design (mobile/tablet)
   - JavaScript error detection

2. **Navigation Tests** (`navigation.spec.ts`)
   - Page navigation (About, Contact, Our Team, Blog)
   - Logo click navigation
   - Footer link functionality
   - Browser history (back/forward)
   - 404 error handling
   - Active navigation states
   - Keyboard navigation

3. **Accessibility Tests** (`accessibility.spec.ts`)
   - WCAG 2 AA compliance
   - Color contrast validation
   - Heading hierarchy
   - Image alt text
   - Form label associations
   - Keyboard navigation
   - ARIA landmarks
   - Screen reader compatibility

4. **API Tests** (`health.spec.ts`)
   - Health endpoint validation
   - Authentication requirements
   - API performance testing
   - Concurrent request handling
   - Error handling
   - Rate limiting

## AI-Powered Testing

### Using Cline (This AI Assistant) for Testing

I can help you with automated testing in several ways:

#### 1. **Generate New Tests**

Ask me to create tests for specific features:
- "Write tests for the product search functionality"
- "Create E2E tests for user authentication"
- "Add tests for the checkout process"

#### 2. **Run and Analyze Tests**

I can execute tests and analyze results:
- Run test suites and report failures
- Identify flaky tests
- Suggest fixes for failing tests

#### 3. **Use Browser Action Tool**

I can manually test your site using the browser_action tool:
- Navigate through user flows
- Take screenshots
- Identify visual or functional issues
- Generate test code based on manual exploration

Example workflow:
1. Ask me to "test the product listing page"
2. I'll launch a browser, navigate the site, and take screenshots
3. I'll report any issues found
4. I'll generate tests to prevent regression

#### 4. **Maintain Tests**

As your application evolves, I can:
- Update tests when UI changes
- Fix broken selectors
- Refactor test code
- Add new test scenarios

### Example AI Testing Prompts

```
"Test the homepage and report any accessibility issues"
"Create E2E tests for creating a new market stand"
"Run all tests and analyze the failures"
"Update the navigation tests to include the new menu items"
"Generate tests for the delivery zone management feature"
```

## Writing Tests

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const element = page.locator('selector');
    
    // Act
    await element.click();
    
    // Assert
    await expect(page).toHaveURL('/expected-url');
  });
});
```

### Using Test Helpers

```typescript
import { waitForPageLoad, fillFormField } from '../utils/test-helpers';

test('form submission', async ({ page }) => {
  await page.goto('/contact');
  await waitForPageLoad(page);
  
  await fillFormField(page, '#email', 'test@example.com');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Accessibility Testing

```typescript
import AxeBuilder from '@axe-core/playwright';

test('accessibility compliance', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page }).analyze();
  
  expect(results.violations).toEqual([]);
});
```

## CI/CD Integration

### GitHub Actions

Tests automatically run on:
- Push to main, develop, or feature/* branches
- Pull requests to main or develop

The workflow:
1. Installs dependencies
2. Installs Playwright browsers
3. Runs all tests
4. Uploads test reports as artifacts
5. Runs separate accessibility test suite

### Required GitHub Secrets

Configure these secrets in your repository settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

### Viewing Test Reports

After a CI run:
1. Go to the Actions tab in GitHub
2. Click on the workflow run
3. Download the `playwright-report` artifact
4. Extract and open `index.html`

## Best Practices

### 1. **Use Data Test IDs**

Add data-testid attributes for reliable selectors:

```tsx
<button data-testid="submit-button">Submit</button>
```

```typescript
await page.click('[data-testid="submit-button"]');
```

### 2. **Avoid Hard-Coded Waits**

❌ Bad:
```typescript
await page.waitForTimeout(5000);
```

✅ Good:
```typescript
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();
```

### 3. **Use Page Object Model**

For complex pages, create page objects:

```typescript
class HomePage {
  constructor(private page: Page) {}
  
  async navigateToProducts() {
    await this.page.click('[data-testid="products-link"]');
  }
}
```

### 4. **Independent Tests**

Each test should be independent:
- Don't rely on test execution order
- Clean up test data after each test
- Use beforeEach/afterEach for setup/teardown

### 5. **Meaningful Assertions**

```typescript
// Be specific
await expect(page.locator('h1')).toHaveText('Welcome to Cornucopia');

// Not just
await expect(page.locator('h1')).toBeVisible();
```

## Troubleshooting

### Tests Fail Locally But Pass in CI

- Check Node.js version matches CI (20.x)
- Ensure environment variables are set
- Run `npm ci` instead of `npm install`

### Flaky Tests

- Use `waitForLoadState` instead of timeouts
- Check for race conditions
- Use `test.retries(2)` for known flaky tests

### Slow Tests

- Use `test.slow()` to increase timeout for specific tests
- Run tests in parallel (default in Playwright)
- Use `--workers=1` for debugging

### Browser Not Found

```bash
npx playwright install chromium
```

### Screenshots Not Captured

Ensure test-results directory exists and has write permissions.

## Advanced Features

### Visual Regression Testing

```typescript
test('visual regression', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png');
});
```

### Network Mocking

```typescript
await page.route('**/api/products', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ products: [] })
  });
});
```

### Mobile Testing

```typescript
test.use({ ...devices['iPhone 12'] });

test('mobile view', async ({ page }) => {
  // Test runs on iPhone 12 viewport
});
```

## Next Steps

1. **Expand Test Coverage**: Add tests for authentication, product management, checkout
2. **Add Visual Regression**: Implement screenshot comparison tests
3. **Performance Testing**: Add Lighthouse CI integration
4. **Test Data Management**: Set up test database seeding
5. **Monitoring**: Integrate with testing dashboards

## Getting Help

- **Playwright Docs**: https://playwright.dev
- **Ask This AI (Cline)**: I can help write, debug, and maintain your tests
- **Axe Accessibility**: https://www.deque.com/axe/

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass before committing
3. Update this documentation if needed
4. Run accessibility tests for UI changes

---

**Happy Testing! 🎭**

For AI-assisted testing, simply ask me to help with any testing task!
