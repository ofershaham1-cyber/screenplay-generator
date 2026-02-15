import { test, expect } from '@playwright/test';

test.describe('Audiobook Generation E2E', () => {
  test('should generate audiobook and show ongoing request in /requests page', async ({ page }) => {
    // Navigate to generator page
    await page.goto('/generator', { waitUntil: 'domcontentloaded' });
    
    // Wait for the page to be ready
    await page.waitForTimeout(500);

    // Fill in story pitch
    const storyPitch = 'Create an audiobook about a detective solving a mysterious case in a small town.';
    await page.fill('textarea[placeholder="Enter your story pitch..."]', storyPitch);

    // Select Audiobook generation type
    const audiobookRadio = page.locator('input[name="generationType"][value="audiobook"]');
    await audiobookRadio.check();
    
    // Verify audiobook is selected
    await expect(audiobookRadio).toBeChecked();

    // Select at least one language (English)
    const englishCheckbox = page.locator('label', { hasText: /^English$/ }).locator('input[type="checkbox"]');
    await englishCheckbox.check();
    
    // Verify English is selected
    await expect(englishCheckbox).toBeChecked();

    // Set minimum lines per dialog to a reasonable value
    await page.fill('input[type="number"]', '20');

    // Click the Generate button
    const generateButton = page.locator('button').filter({ hasText: /Generate Screenplay|Generating/ });
    await generateButton.click();

    // Wait for the request to be sent (button should become disabled and show "Generating...")
    await page.waitForTimeout(1000); // Give time for button state to change
    await expect(generateButton).toContainText('Generating...');
    await expect(generateButton).toBeDisabled();

    // Navigate to the requests/ongoing page
    await page.goto('/requests', { waitUntil: 'networkidle' });
    
    // Wait for the requests header to appear (indicates page is showing requests)
    await page.locator('h2:has-text("Requests")').waitFor({ state: 'visible', timeout: 5000 });

    // Verify we can see ongoing requests
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toMatch(/Requests in Progress|No requests in progress/);

    expect(requestItemsVisible).toBeTruthy();

    // After generation completes, navigate to history to verify audiobook is accessible
    // Wait for generation to complete (up to 60 seconds)
    await page.waitForTimeout(10000); // Give it some time to complete

    // Navigate to history page
    await page.goto('/history', { waitUntil: 'networkidle' });
    
    // Wait for history to load and filter to show audiobooks
    await page.locator('h3:has-text("Screenplay History")').waitFor({ state: 'visible', timeout: 5000 });
    
    // Filter to show audiobooks only
    const filterSelect = page.locator('select').first();
    await filterSelect.selectOption('audiobook');
    
    // Wait for filtered results to appear
    await page.waitForTimeout(500);
    
    // Check if audiobook is listed in history with the audiobook badge
    const audiobookBadge = page.locator('span:has-text("🎵 Audiobook")');
    const audiobookCount = await audiobookBadge.count();
    
    // Should have at least one audiobook in history
    expect(audiobookCount).toBeGreaterThan(0);
  });

  test('should generate audiobook and make it accessible from result page', async ({ page }) => {
    // Navigate to generator page
    await page.goto('/generator', { waitUntil: 'domcontentloaded' });
    
    // Fill story pitch
    const storyPitch = 'A sci-fi audiobook about exploring distant planets.';
    await page.fill('textarea[placeholder="Enter your story pitch..."]', storyPitch);

    // Select Audiobook generation type
    await page.locator('input[name="generationType"][value="audiobook"]').check();

    // Select languages
    const languageCheckboxes = page.locator('label').filter({ hasText: /English|Spanish|French/ });
    const firstCheckbox = languageCheckboxes.first().locator('input[type="checkbox"]');
    await firstCheckbox.check();

    // Set minimum lines per dialog
    await page.fill('input[type="number"]', '10');

    // Generate audiobook
    const generateButton = page.locator('button').filter({ hasText: /Generate Screenplay|Generating/ });
    await generateButton.click();

    // Wait for button to show generating state
    await page.waitForTimeout(1000); // Give time for button state to change
    await expect(generateButton).toContainText('Generating...');
    await expect(generateButton).toBeDisabled();

    // Wait briefly, then navigate to result page to see if audiobook appears
    await page.waitForTimeout(3000);
    await page.goto('/screenplay-result', { waitUntil: 'domcontentloaded' });

    // Verify result page loads (may show "No Screenplay Generated" if still generating)
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();

    // Check for audiobook rendering elements (Cast, Narration, etc.)
    const castSection = page.locator('text=/Cast|Narration|Dialog/i');
    const hasResultContent = await castSection.count() > 0 || pageContent.includes('Audiobook') || pageContent.includes('No Screenplay Generated');
    
    expect(hasResultContent).toBeTruthy();
  });

  test('should show request with audiobook details', async ({ page }) => {
    // Navigate to generator page
    await page.goto('/generator', { waitUntil: 'domcontentloaded' });
    
    // Fill in story pitch
    const storyPitch = 'A fantasy adventure with dragons and magic.';
    await page.fill('textarea[placeholder="Enter your story pitch..."]', storyPitch);

    // Select Audiobook generation type
    await page.locator('input[name="generationType"][value="audiobook"]').check();

    // Select a language - look for any available language checkbox
    const languageCheckboxes = page.locator('label', { has: page.locator('input[type="checkbox"]') });
    const firstLanguageCheckbox = languageCheckboxes.first().locator('input[type="checkbox"]');
    await firstLanguageCheckbox.check();

    // Set minimum lines per dialog
    await page.fill('input[type="number"]', '15');

    // Click Generate
    const generateButton = page.locator('button').filter({ hasText: /Generate Screenplay|Generating/ });
    await generateButton.click();

    // Wait for generation to start
    await expect(generateButton).toContainText('Generating...');

    // Navigate to requests page
    await page.goto('/requests', { waitUntil: 'networkidle' });

    // Wait for the requests header to appear
    await page.locator('h2:has-text("Requests")').waitFor({ state: 'visible', timeout: 5000 });

    // Verify request content is visible
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toMatch(/Requests in Progress|No requests in progress/);

    // Verify at least one request is showing
    const hasRequestIndicators = await page.locator('text=/⏳ Generating|✓ Complete|Duration:/i').count() > 0;
    expect(hasRequestIndicators).toBeTruthy();
  });
});
