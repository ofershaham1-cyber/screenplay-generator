import { test, expect } from '@playwright/test';

const ROUTES = [
  '/',
  '/generator',
  '/ongoing',
  '/player',
  '/history',
  '/preferences',
  '/format-schema',
  '/view-models',
];

test.describe('App Navigation - No JS Errors', () => {
  test('should navigate to all routes without JS errors', async ({ page }) => {
    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Track page errors
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.toString());
    });

    // Navigate to each route
    for (const route of ROUTES) {
      const fullUrl = route === '/' ? '/' : route;
      
      // Navigate to the route
      await page.goto(fullUrl, { waitUntil: 'domcontentloaded' });
      
      // Wait a bit for any async operations
      await page.waitForTimeout(500);

      // Assert no errors occurred during this navigation
      expect(
        consoleErrors,
        `Console error occurred on route ${route}: ${consoleErrors[consoleErrors.length - 1]}`
      ).toHaveLength(0);
      
      expect(
        pageErrors,
        `Page error occurred on route ${route}: ${pageErrors[pageErrors.length - 1]}`
      ).toHaveLength(0);

    }
  });
});
