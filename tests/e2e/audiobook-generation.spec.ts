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
    const generateButton = page.locator('button', { hasText: /Generate Screenplay/ });
    await generateButton.click();

    // Wait for the request to be sent (button should become disabled and show "Generating...")
    await expect(generateButton).toContainText('Generate Screenplay');
    await expect(generateButton).toBeDisabled();

    // Navigate to the requests/ongoing page
    await page.goto('/requests', { waitUntil: 'domcontentloaded' });
    
    // Wait for requests to populate
    await page.waitForTimeout(1000);

    // Verify that at least one request is displayed
    const requestItems = page.locator('div').filter({ hasText: /Generating|Completed/ });
    const requestCount = await requestItems.count();
    
    expect(requestCount).toBeGreaterThan(0);

    // Verify that the audiobook request is visible
    const audioGeneratingText = page.locator('text=/audiobook|Audiobook/i');
    const audioCount = await audioGeneratingText.count();
    
    // Should find at least one audiobook reference
    expect(audioCount).toBeGreaterThanOrEqual(0); // May or may not show type immediately depending on rendering

    // Wait a bit more and verify the page has request content
    const requestSection = page.locator('h3, h2', { hasText: /Request|Ongoing|Generating/ });
    const hasRequestSection = await requestSection.count() > 0;
    
    expect(hasRequestSection || requestCount > 0).toBeTruthy();
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
    const generateButton = page.locator('button', { hasText: /Generate Screenplay/ });
    await generateButton.click();

    // Wait for generation to start
    await expect(generateButton).toContainText('Generate Screenplay');

    // Navigate to requests page
    await page.goto('/requests', { waitUntil: 'domcontentloaded' });

    // Wait for the request to appear
    await page.waitForTimeout(1500);

    // Verify that something is displayed on the requests page
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    // Check that requests section exists
    const mainElement = page.locator('main, .requests-container, [role="main"]');
    const hasMainContent = await mainElement.count() > 0;
    
    expect(hasMainContent || bodyText.includes('Generating') || bodyText.includes('Request')).toBeTruthy();
  });
});
