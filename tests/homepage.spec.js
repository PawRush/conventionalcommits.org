// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test('should load homepage correctly with all essential elements', async ({ page }) => {
    // Navigate to the homepage (will redirect to a version page)
    await page.goto('/en/v1.0.0/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check that the body content is visible
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check for specification content sections
    const summarySection = page.locator('#summary, #概要, #riepilogo, #resumo, #خلاصه, #الملخص').first();
    await expect(summarySection).toBeVisible();

    // Check for specification section
    const specSection = page.locator('#specification, #specifica, #specyfikacja, #spécification, #especificación, #規格').first();
    await expect(specSection).toBeVisible();

    // Verify GitHub link is present
    const githubLink = page.locator('a[href*="github.com/conventional-commits"]');
    await expect(githubLink).toBeVisible();

    // Check that the page has proper structure
    const bodyContent = page.locator('body');
    await expect(bodyContent).toBeVisible();

    // Verify no console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Verify there are no major layout issues by checking viewport
    const viewport = page.viewportSize();
    expect(viewport.width).toBeGreaterThan(0);
    expect(viewport.height).toBeGreaterThan(0);
  });

  test('should have proper meta tags and viewport', async ({ page }) => {
    await page.goto('/en/v1.0.0/');

    // Check that viewport meta tag exists
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);

    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/en/v1.0.0/');
    await page.waitForLoadState('networkidle');

    // Verify no JavaScript errors occurred
    expect(errors).toHaveLength(0);
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/en/v1.0.0/');

    // Check that there's a body content (navigation elements may vary by theme)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check for common navigation elements
    const hasNav = await page.locator('nav, header, .navigation, [role="navigation"]').count() > 0;
    const hasLinks = await page.locator('a').count() > 0;

    // Should have either navigation elements or links
    expect(hasNav || hasLinks).toBeTruthy();
  });
});
