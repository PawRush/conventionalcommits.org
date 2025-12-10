// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Language Switching', () => {
  test('should display language selector', async ({ page }) => {
    await page.goto('/en/v1.0.0/');
    await page.waitForLoadState('networkidle');

    // Look for language selector - it might be a dropdown, list, or navigation
    const languageSelector = page.locator('.language-selector, select[name*="language"], select[name*="lang"], nav select, .lang-switch, [class*="language"]').first();

    // Check if there are language links instead
    const languageLinks = page.locator('a[href*="/en/"], a[href*="/it/"], a[href*="/zh-"], a[href*="/es/"], a[href*="/fr/"]');

    // At least one should be visible
    const hasSelector = await languageSelector.count() > 0;
    const hasLinks = await languageLinks.count() > 0;

    expect(hasSelector || hasLinks).toBeTruthy();
  });

  test('should switch to Italian language', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Try to find and click Italian language option
    const italianLink = page.locator('a[href*="/it/"]').first();

    if (await italianLink.count() > 0) {
      await italianLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on Italian page
      expect(page.url()).toContain('/it/');

      // Check for Italian content
      const content = await page.textContent('body');
      expect(content).toMatch(/Commit Convenzionali|Riepilogo|Specifica/i);
    }
  });

  test('should switch to Chinese (Simplified) language', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Try to find and click Chinese language option
    const chineseLink = page.locator('a[href*="/zh-hans/"]').first();

    if (await chineseLink.count() > 0) {
      await chineseLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on Chinese page
      expect(page.url()).toContain('/zh-hans/');

      // Check for Chinese content
      const content = await page.textContent('body');
      expect(content).toMatch(/约定式提交|阅读规范/);
    }
  });

  test('should switch to Spanish language', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Try to find and click Spanish language option
    const spanishLink = page.locator('a[href*="/es/"]').first();

    if (await spanishLink.count() > 0) {
      await spanishLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on Spanish page
      expect(page.url()).toContain('/es/');

      // Check for Spanish content
      const content = await page.textContent('body');
      expect(content).toMatch(/Commits Convencionales|Especificación/i);
    }
  });

  test('should switch to French language', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Try to find and click French language option
    const frenchLink = page.locator('a[href*="/fr/"]').first();

    if (await frenchLink.count() > 0) {
      await frenchLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on French page
      expect(page.url()).toContain('/fr/');

      // Check for French content
      const content = await page.textContent('body');
      expect(content).toMatch(/Commits Conventionnels|Spécification/i);
    }
  });

  test('should maintain language preference when navigating', async ({ page }) => {
    await page.goto('/it/');
    await page.waitForLoadState('networkidle');

    // Verify we're on Italian version
    expect(page.url()).toContain('/it/');

    // Get the html lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toContain('it');
  });

  test('should have correct language in HTML lang attribute', async ({ page }) => {
    // Test English
    await page.goto('/en/');
    let htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toContain('en');

    // Test Chinese
    await page.goto('/zh-hans/');
    htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toContain('zh');
  });

  test('should support RTL languages (Arabic/Persian)', async ({ page }) => {
    // Test Arabic if available
    await page.goto('/');
    const arabicLink = page.locator('a[href*="/ar/"]').first();

    if (await arabicLink.count() > 0) {
      await arabicLink.click();
      await page.waitForLoadState('networkidle');

      // Check for RTL direction
      const dir = await page.locator('html').getAttribute('dir');
      expect(dir).toBe('rtl');
    }
  });
});
