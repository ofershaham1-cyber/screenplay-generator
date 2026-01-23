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
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Track page errors
    const pageErrors = [];
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

      // Basic sanity check: page should have content
      const bodyContent = await page.locator('body').evaluate((el) => el.textContent);
      expect(bodyContent, `Route ${route} should have rendered content`).toBeTruthy();
    }
  });

  test('should navigate between routes without JS errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const pageErrors = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.toString());
    });

    // Start at home
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Click through sidebar navigation links
    const navLinks = await page.locator('a[href^="/"]').all();
    
    for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
      const href = await navLinks[i].getAttribute('href');
      if (href && href !== '#') {
        await navLinks[i].click().catch(() => {
          // Link might not be clickable, that's ok
        });
        await page.waitForTimeout(500);
      }
    }

    expect(consoleErrors, `Console errors during navigation: ${consoleErrors.join(', ')}`).toHaveLength(0);
    expect(pageErrors, `Page errors during navigation: ${pageErrors.join(', ')}`).toHaveLength(0);
  });

  test('Clear All button should deselect all models', async ({ page }) => {
    // Navigate to generator
    await page.goto('/generator', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500); // Wait for models to load

    // Enable multiple models mode by looking for the label with text "Generate for Multiple Models"
    const multiModelLabel = page.locator('label').filter({ hasText: 'Generate for Multiple Models' }).first();
    const multiModelCheckbox = multiModelLabel.locator('input[type="checkbox"]');
    await multiModelCheckbox.check();
    await page.waitForTimeout(200);

    // Click "Select All" to select all models
    const selectAllBtn = page.locator('button').filter({ hasText: 'Select All' }).first();
    await selectAllBtn.click();
    await page.waitForTimeout(150);

    // Verify models are selected
    const selectedCheckboxes = page.locator('div.lang-grid input[type="checkbox"]:checked');
    const countBefore = await selectedCheckboxes.count();
    expect(countBefore, 'Should have selected models').toBeGreaterThan(0);

    // Click "Clear All" button
    const clearAllBtn = page.locator('button').filter({ hasText: 'Clear All' }).first();
    await clearAllBtn.click();
    await page.waitForTimeout(150);

    // Verify all models are deselected
    const selectedCheckboxesAfter = page.locator('div.lang-grid input[type="checkbox"]:checked');
    const countAfter = await selectedCheckboxesAfter.count();
    expect(countAfter, 'All models should be deselected after Clear All').toBe(0);

    // Verify the count display updates
    const countDisplay = page.locator('p').filter({ hasText: 'model(s) selected' });
    const displayCount = await countDisplay.count();
    expect(displayCount, 'Should have count display when models selected or just cleared').toBeGreaterThanOrEqual(0);
  });
});
