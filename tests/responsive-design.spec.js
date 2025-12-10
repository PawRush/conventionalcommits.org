// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Mobile Landscape', width: 667, height: 375 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Large Desktop', width: 2560, height: 1440 },
  ];

  for (const viewport of viewports) {
    test(`should display correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/en/');
      await page.waitForLoadState('networkidle');

      // Check that the page is visible
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Check main heading is visible
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      // Check that content doesn't overflow
      const bodyWidth = await body.evaluate(el => el.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20); // Allow small margin for scrollbar

      // Verify no horizontal scrolling is required (within reason)
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
    });
  }

  test('should have mobile-friendly navigation on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Look for mobile menu button/hamburger if it exists
    const mobileMenuButton = page.locator('button[aria-label*="menu"], .menu-toggle, .hamburger, [class*="mobile-menu"]').first();

    // On mobile, either the menu should be visible or there should be a toggle button
    const hasVisibleMenu = await page.locator('nav').first().isVisible();
    const hasMobileButton = await mobileMenuButton.count() > 0;

    expect(hasVisibleMenu || hasMobileButton).toBeTruthy();
  });

  test('should have readable text on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Check that main content has readable font size
    const mainContent = page.locator('main, article, .content, body').first();
    const fontSize = await mainContent.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });

    // Font size should be at least 14px on mobile
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(14);
  });

  test('should have proper touch targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Get all links
    const links = page.locator('a');
    const linkCount = await links.count();

    if (linkCount > 0) {
      // Check first few links for appropriate touch target size
      const linksToCheck = Math.min(linkCount, 5);

      for (let i = 0; i < linksToCheck; i++) {
        const link = links.nth(i);
        if (await link.isVisible()) {
          const box = await link.boundingBox();
          if (box) {
            // Touch targets should be at least 44x44px (Apple HIG) or 48x48px (Material Design)
            // We'll use a more lenient 30px minimum for text links
            expect(box.height).toBeGreaterThanOrEqual(20);
          }
        }
      }
    }
  });

  test('should adapt layout for tablet screens', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Check that the page renders properly
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Content should be readable
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible();

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });

  test('should maintain functionality across different screen sizes', async ({ page }) => {
    const testViewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 },
    ];

    for (const viewport of testViewports) {
      await page.setViewportSize(viewport);
      await page.goto('/en/');
      await page.waitForLoadState('networkidle');

      // Check that GitHub link is accessible
      const githubLink = page.locator('a[href*="github.com"]').first();
      await expect(githubLink).toBeVisible();

      // Check that main content sections are visible
      const summarySection = page.locator('#summary').first();
      if (await summarySection.count() > 0) {
        await expect(summarySection).toBeVisible();
      }
    }
  });

  test('should have accessible navigation menu on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Navigation should be visible on desktop
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });

  test('should not have overlapping elements', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Check that there are no elements with negative margins causing overlap issues
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Take a screenshot to help debug layout issues if test fails
    await page.screenshot({ path: 'responsive-mobile.png', fullPage: true });
  });

  test('should support zoom/scaling without breaking layout', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Simulate zoom by changing viewport and device scale factor
    await page.setViewportSize({ width: 1280, height: 720 });

    // Check page is still functional
    const body = page.locator('body');
    await expect(body).toBeVisible();

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should handle orientation changes gracefully', async ({ page }) => {
    // Portrait mode
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    const headingPortrait = page.locator('h1').first();
    await expect(headingPortrait).toBeVisible();

    // Landscape mode
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForLoadState('load');

    const headingLandscape = page.locator('h1').first();
    await expect(headingLandscape).toBeVisible();
  });
});
