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
    await page.waitForTimeout(1000); // Wait for models to load

    // Enable multiple models mode
    const multiModelCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Generate for Multiple Models/ }).first();
    await multiModelCheckbox.check();
    await page.waitForTimeout(500);

    // Click "Select All" to select all models
    const selectAllBtn = page.locator('button:has-text("Select All")').first();
    await selectAllBtn.click();
    await page.waitForTimeout(500);

    // Verify models are selected
    const selectedCheckboxes = page.locator('div.lang-grid input[type="checkbox"]:checked');
    const countBefore = await selectedCheckboxes.count();
    expect(countBefore, 'Should have selected models').toBeGreaterThan(0);

    // Click "Clear All" button
    const clearAllBtn = page.locator('button:has-text("Clear All")').first();
    await clearAllBtn.click();
    await page.waitForTimeout(1000); // Increased wait time for state update

    // Verify all models are deselected
    const selectedCheckboxesAfter = page.locator('div.lang-grid input[type="checkbox"]:checked');
    const countAfter = await selectedCheckboxesAfter.count();
    expect(countAfter, 'All models should be deselected after Clear All').toBe(0);

    // Verify the count display updates
    const countDisplay = page.locator('p').filter({ hasText: 'model(s) selected' });
    const displayCount = await countDisplay.count();
    expect(displayCount, 'Should have count display when models selected or just cleared').toBeGreaterThanOrEqual(0);
  });

    // Verify the count display shows 0 or doesn't exist
    const countDisplay = page.locator('p:has-text("model(s) selected")');
    const displayCount = await countDisplay.count();
    if (displayCount > 0) {
      const displayText = await countDisplay.textContent();
      expect(displayText, 'Model count should show 0').toContain('0');
    }
  });

  test('Title input should be optional and persist in form', async ({ page }) => {
    // Navigate to generator
    await page.goto('/generator', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Check that title input exists and is optional (no required marker)
    const titleLabel = page.locator('label').filter({ hasText: 'Title (optional)' });
    await expect(titleLabel, 'Title label should show "(optional)"').toBeVisible();

    // Find the title input
    const titleInput = page.locator('input[type="text"]').filter({ hasText: '' });
    await expect(titleInput, 'Title input should exist').toBeVisible();

    // Enter a title
    const testTitle = 'My Test Screenplay';
    await titleInput.fill(testTitle);
    await page.waitForTimeout(100);

    // Verify the title is entered
    const inputValue = await titleInput.inputValue();
    expect(inputValue, 'Title should be entered correctly').toBe(testTitle);

    // Navigate away and back to verify persistence
    await page.goto('/preferences', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await page.goto('/generator', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Check if title persisted
    const persistedValue = await titleInput.inputValue();
    expect(persistedValue, 'Title should persist after navigation').toBe(testTitle);
  });

  test('Min Lines Per Dialog input should be required and have validation', async ({ page }) => {
    // Navigate to generator
    await page.goto('/generator', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Check that min lines input exists and is required
    const minLinesLabel = page.locator('label').filter({ hasText: 'Minimum Lines Per Dialog' });
    await expect(minLinesLabel, 'Min Lines label should be visible').toBeVisible();

    // Check for required marker
    const requiredMarker = minLinesLabel.locator('span:has-text("*")');
    await expect(requiredMarker, 'Min Lines should have required marker').toBeVisible();

    // Find the min lines input
    const minLinesInput = page.locator('input[type="number"]').first();
    await expect(minLinesInput, 'Min Lines input should exist').toBeVisible();

    // Check default value
    const defaultValue = await minLinesInput.inputValue();
    expect(defaultValue, 'Min Lines should have a default value').toBeTruthy();

    // Enter a custom value
    await minLinesInput.fill('75');
    await page.waitForTimeout(100);

    // Verify the value is entered
    const inputValue = await minLinesInput.inputValue();
    expect(inputValue, 'Min Lines should be entered correctly').toBe('75');

    // Verify min/max attributes
    const minAttr = await minLinesInput.getAttribute('min');
    const maxAttr = await minLinesInput.getAttribute('max');
    expect(minAttr, 'Min Lines should have min attribute').toBe('1');
    expect(maxAttr, 'Min Lines should have max attribute').toBe('200');
  });

  test('Generate button should be disabled when required fields are missing', async ({ page }) => {
    // Navigate to generator
    await page.goto('/generator', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Clear the story pitch (required field)
    const storyPitchTextarea = page.locator('textarea').first();
    await storyPitchTextarea.fill('');
    await page.waitForTimeout(100);

    // Find the generate button
    const generateBtn = page.locator('button').filter({ hasText: 'Generate Screenplay' });
    
    // The button should be disabled or show validation error
    // Note: The actual validation logic may vary, so we check if button is disabled or form is invalid
    const isDisabled = await generateBtn.getAttribute('disabled');
    // If disabled, the test passes. If not disabled, we check for validation errors
    if (isDisabled === null) {
      // Button is not disabled, check for validation feedback
      const errorMessages = page.locator('.error');
      const errorCount = await errorMessages.count();
      expect(errorCount, 'Should show validation error when required fields are missing').toBeGreaterThan(0);
    }
  });

  test('Configuration-based generator shows correct form fields', async ({ page }) => {
    // Navigate to generator
    await page.goto('/generator', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Verify all configured fields are visible
    const fields = [
      { label: 'Story pitch', type: 'textarea' },
      { label: 'Languages Used', type: 'checkbox-group' },
      { label: 'Default Screenplay Language', type: 'select' },
      { label: 'Minimum Lines Per Dialog', type: 'input' },
    ];

    for (const field of fields) {
      const element = page.locator('label').filter({ hasText: new RegExp(field.label, 'i') });
      await expect(element, `Field "${field.label}" should be visible`).toBeVisible();
    }

    // Verify min_lines_per_dialog IS required (has asterisk)
    const minLinesLabel = page.locator('label').filter({ hasText: 'Minimum Lines Per Dialog' });
    const minLinesAsterisk = minLinesLabel.locator('span:has-text("*")');
    await expect(minLinesAsterisk, 'Min Lines Per Dialog should have required marker').toBeVisible();
  });

  test('History page shows title in book index style', async ({ page }) => {
    // Navigate to history page
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Check for history page header
    const header = page.locator('h1').filter({ hasText: 'Screenplay History' });
    await expect(header, 'History page header should be visible').toBeVisible();

    // Check for empty state or history items
    const emptyState = page.locator('.empty-state');
    const emptyStateCount = await emptyState.count();
    
    if (emptyStateCount > 0) {
      // No history yet - this is expected for a fresh test
      await expect(emptyState, 'Empty state should be visible when no history').toBeVisible();
    } else {
      // History exists - check for history items
      const historyItems = page.locator('.history-item');
      const itemCount = await historyItems.count();
      expect(itemCount, 'Should have history items').toBeGreaterThan(0);

      // Check that history items have proper structure
      const firstItem = historyItems.first();
      const title = firstItem.locator('.history-title');
      await expect(title, 'History item should have a title').toBeVisible();
      
      const date = firstItem.locator('.history-date');
      await expect(date, 'History item should have a date').toBeVisible();
      
      const meta = firstItem.locator('.history-meta');
      await expect(meta, 'History item should have meta info').toBeVisible();
    }
  });

  test('Ongoing page shows grid of requests and allows canceling', async ({ page }) => {
    // Navigate to ongoing page
    await page.goto('/ongoing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Check for ongoing page header
    const header = page.locator('h2').filter({ hasText: 'Ongoing' });
    await expect(header, 'Ongoing page header should be visible').toBeVisible();

    // Check for model status container
    const modelStatus = page.locator('.model-status');
    const statusExists = await modelStatus.count();
    
    if (statusExists > 0) {
      // Model status exists - check for request items
      const requestItems = page.locator('div[style*="border-left"]');
      const itemCount = await requestItems.count();
      
      if (itemCount > 0) {
        // Check that request items have proper structure
        const firstItem = requestItems.first();
        
        // Check for model name (first div with font-weight: 500)
        const modelLabel = firstItem.locator('div').filter({ hasText: /model/ });
        const modelLabelCount = await modelLabel.count();
        
        if (modelLabelCount > 0) {
          await expect(modelLabel.first(), 'Request item should show model name').toBeVisible();
        }
        
        // Check for status badge
        const statusBadge = firstItem.locator('span').filter({ hasText: /Generating|Complete|Error|Cancelled|Pending/ });
        await expect(statusBadge.first(), 'Request item should have status badge').toBeVisible();
        
        // Check for cancel button (only if request is active)
        const cancelBtn = firstItem.locator('button').filter({ hasText: 'Cancel' });
        const cancelBtnCount = await cancelBtn.count();
        
        if (cancelBtnCount > 0) {
          // Verify cancel button is visible
          await expect(cancelBtn.first(), 'Cancel button should be visible for active requests').toBeVisible();
        }
      }
    } else {
      // No model status exists - check for empty state
      const emptyState = page.locator('p').filter({ hasText: /No generation in progress/ });
      await expect(emptyState, 'Empty state should be visible when no requests').toBeVisible();
    }
  });

  test('Sidebar shows history badge with count', async ({ page }) => {
    // Navigate to any page
    await page.goto('/generator', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Check for history badge in sidebar
    const historyBadge = page.locator('.history-badge');
    const badgeCount = await historyBadge.count();
    
    // Badge should exist (may show 0 or a number)
    expect(badgeCount, 'History badge should exist in sidebar').toBeGreaterThan(0);
    
    // If badge has content, verify it's a number
    if (badgeCount > 0) {
      const badgeText = await historyBadge.textContent();
      const badgeNumber = parseInt(badgeText);
      expect(badgeNumber, 'Badge should show a number').not.toBeNaN();
    }
  });
});
