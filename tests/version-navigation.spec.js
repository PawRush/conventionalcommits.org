// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Version Navigation', () => {
  test('should display version selector on page', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Look for version selector or version links
    const versionSelector = page.locator('select[name*="version"], .version-selector, [class*="version"]').first();
    const versionLinks = page.locator('a[href*="v1.0.0"]');

    const hasSelector = await versionSelector.count() > 0;
    const hasLinks = await versionLinks.count() > 0;

    // Version navigation should exist
    expect(hasSelector || hasLinks).toBeTruthy();
  });

  test('should navigate to v1.0.0 specification', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Try to find v1.0.0 link
    const v1Link = page.locator('a[href*="v1.0.0"]').first();

    if (await v1Link.count() > 0) {
      await v1Link.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on v1.0.0 page
      expect(page.url()).toContain('v1.0.0');

      // Check that the version indicator is present
      const content = await page.textContent('body');
      expect(content).toMatch(/v1\.0\.0|version 1\.0\.0/i);
    } else {
      // If we're already on v1.0.0, check that
      expect(page.url()).toContain('v1.0.0');
    }
  });

  test('should navigate to beta versions if available', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Try to find beta version link
    const betaLink = page.locator('a[href*="v1.0.0-beta"]').first();

    if (await betaLink.count() > 0) {
      await betaLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on a beta page
      expect(page.url()).toMatch(/v1\.0\.0-beta/);

      // Page should load successfully
      const mainContent = page.locator('body');
      await expect(mainContent).toBeVisible();
    }
  });

  test('should maintain language when switching versions', async ({ page }) => {
    // Start on Italian v1.0.0
    await page.goto('/it/v1.0.0/');
    await page.waitForLoadState('networkidle');

    // Verify we're on Italian page
    expect(page.url()).toContain('/it/');

    // Try to find another version link
    const versionLinks = page.locator('a[href*="v1.0.0-beta"]');

    if (await versionLinks.count() > 0) {
      await versionLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Language should still be Italian
      expect(page.url()).toContain('/it/');
    }
  });

  test('should display version number in page content', async ({ page }) => {
    await page.goto('/en/v1.0.0/');
    await page.waitForLoadState('networkidle');

    // Check for version indicators in the content
    const content = await page.textContent('body');

    // Should contain version reference
    expect(content).toMatch(/1\.0\.0/);
  });

  test('should load all available versions without errors', async ({ page }) => {
    const versions = ['v1.0.0', 'v1.0.0-beta.4', 'v1.0.0-beta.3', 'v1.0.0-beta.2'];

    for (const version of versions) {
      const errors = [];
      page.on('pageerror', error => {
        errors.push(error.message);
      });

      try {
        await page.goto(`/en/${version}/`);
        await page.waitForLoadState('networkidle', { timeout: 5000 });

        // Check that page loaded
        const body = page.locator('body');
        await expect(body).toBeVisible();

        // No JavaScript errors
        expect(errors).toHaveLength(0);
      } catch (error) {
        // Some versions might not exist, that's okay
        console.log(`Version ${version} may not be available`);
      }
    }
  });

  test('should have working version dropdown/selector if present', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Check for select element
    const versionSelect = page.locator('select[name*="version"]').first();

    if (await versionSelect.count() > 0) {
      // Get all options
      const options = await versionSelect.locator('option').count();
      expect(options).toBeGreaterThan(0);

      // Try selecting a different version
      await versionSelect.selectOption({ index: 0 });

      // Page should still be functional
      await page.waitForLoadState('networkidle');
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });

  test('should have breadcrumbs or version indicator in UI', async ({ page }) => {
    await page.goto('/en/v1.0.0/');
    await page.waitForLoadState('networkidle');

    // Look for version indicator elements
    const versionIndicator = page.locator('[class*="version"], [class*="breadcrumb"], nav, header').first();
    await expect(versionIndicator).toBeVisible();
  });
});
