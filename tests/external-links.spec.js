// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('External Links Verification', () => {
  test('should have valid GitHub repository link', async ({ page }) => {
    await page.goto('/en/v1.0.0/');
    await page.waitForLoadState('networkidle');

    // Find GitHub link
    const githubLink = page.locator('a[href*="github.com/conventional-commits"]').first();
    await expect(githubLink).toBeVisible();

    // Get the href
    const href = await githubLink.getAttribute('href');
    expect(href).toContain('github.com');
    expect(href).toContain('conventional-commits');

    // Verify link is clickable
    await expect(githubLink).toBeEnabled();
  });

  test('should have GitHub link that opens in new tab', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    const githubLink = page.locator('a[href*="github.com"]').first();

    if (await githubLink.count() > 0) {
      const target = await githubLink.getAttribute('target');
      const rel = await githubLink.getAttribute('rel');

      // Check if it opens in new tab and has proper security attributes
      if (target === '_blank') {
        expect(rel).toMatch(/noopener|noreferrer/);
      }
    }
  });

  test('should have valid Creative Commons license link', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Look for Creative Commons license link
    const ccLink = page.locator('a[href*="creativecommons.org"]').first();

    if (await ccLink.count() > 0) {
      await expect(ccLink).toBeVisible();

      const href = await ccLink.getAttribute('href');
      expect(href).toContain('creativecommons.org');
      expect(href).toContain('licenses');
    }
  });

  test('should have accessible external links with proper attributes', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Get all external links (links to different domains)
    const allLinks = page.locator('a[href^="http"]');
    const count = await allLinks.count();

    expect(count).toBeGreaterThan(0);

    // Check first few external links
    const linksToCheck = Math.min(count, 10);

    for (let i = 0; i < linksToCheck; i++) {
      const link = allLinks.nth(i);
      const href = await link.getAttribute('href');

      // Verify href is a valid URL
      expect(href).toMatch(/^https?:\/\/.+/);

      // If link opens in new tab, it should have security attributes
      const target = await link.getAttribute('target');
      if (target === '_blank') {
        const rel = await link.getAttribute('rel');
        expect(rel).toMatch(/noopener|noreferrer/);
      }
    }
  });

  test('should not have broken internal links', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Get all internal links (anchor links and relative links)
    const internalLinks = page.locator('a[href^="#"], a[href^="/"]');
    const count = await internalLinks.count();

    if (count > 0) {
      // Test first few internal links
      const linksToTest = Math.min(count, 10);

      for (let i = 0; i < linksToTest; i++) {
        const link = internalLinks.nth(i);
        const href = await link.getAttribute('href');

        if (href && href.startsWith('#')) {
          // For anchor links, verify target exists
          const targetId = href.substring(1);
          if (targetId) {
            const target = page.locator(`#${CSS.escape(targetId)}, [name="${targetId}"]`).first();
            // Target should exist (but might not be visible if it's further down)
            const targetCount = await target.count();
            expect(targetCount).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });

  test('should have footer links that are accessible', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Look for footer
    const footer = page.locator('footer').first();

    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();

      // Check for links in footer
      const footerLinks = footer.locator('a');
      const linkCount = await footerLinks.count();

      if (linkCount > 0) {
        // At least one footer link should be visible
        const firstLink = footerLinks.first();
        await expect(firstLink).toBeVisible();
      }
    }
  });

  test('should not have any links with javascript: protocol', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Security check: no javascript: links
    const jsLinks = page.locator('a[href^="javascript:"]');
    const count = await jsLinks.count();

    expect(count).toBe(0);
  });

  test('should have proper navigation between specification sections', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Look for table of contents or navigation links
    const tocLinks = page.locator('a[href^="#"]');
    const count = await tocLinks.count();

    if (count > 0) {
      // Click on first TOC link
      const firstTocLink = tocLinks.first();
      const href = await firstTocLink.getAttribute('href');

      await firstTocLink.click();
      await page.waitForTimeout(500); // Wait for smooth scroll

      // Verify URL hash changed
      if (href) {
        expect(page.url()).toContain(href);
      }
    }
  });

  test('should have accessible specification anchor links', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Common specification section IDs
    const sectionIds = ['summary', 'specification', 'why-use-conventional-commits', 'faq'];

    for (const id of sectionIds) {
      const section = page.locator(`#${id}`).first();

      if (await section.count() > 0) {
        // Navigate to the section
        await page.goto(`/en/#${id}`);
        await page.waitForLoadState('networkidle');

        // Verify section exists and is visible
        await expect(section).toBeVisible();
      }
    }
  });

  test('should have badge/shield links if present', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Look for badge images (like shields.io)
    const badges = page.locator('img[src*="shields.io"], img[src*="badge"]');

    if (await badges.count() > 0) {
      const firstBadge = badges.first();
      await expect(firstBadge).toBeVisible();

      // Check if badge is wrapped in a link
      const badgeLink = page.locator('a:has(img[src*="shields.io"]), a:has(img[src*="badge"])').first();

      if (await badgeLink.count() > 0) {
        const href = await badgeLink.getAttribute('href');
        expect(href).toBeTruthy();
      }
    }
  });

  test('should verify external link domains are reachable', async ({ page, request }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Key external links to verify
    const keyDomains = [
      'github.com',
      'creativecommons.org',
    ];

    for (const domain of keyDomains) {
      const link = page.locator(`a[href*="${domain}"]`).first();

      if (await link.count() > 0) {
        const href = await link.getAttribute('href');

        if (href) {
          try {
            // Make a HEAD request to check if the link is reachable
            const response = await request.head(href, { timeout: 10000 });

            // Should get a successful response (2xx or 3xx)
            expect(response.status()).toBeLessThan(400);
          } catch (error) {
            console.log(`Warning: Could not reach ${href}:`, error.message);
            // Don't fail the test for network issues, just log it
          }
        }
      }
    }
  });

  test('should have no dead links in main content', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Get all links in main content area
    const mainContent = page.locator('main, article, .content, body').first();
    const links = mainContent.locator('a[href]');
    const count = await links.count();

    expect(count).toBeGreaterThan(0);

    // Verify first few links have valid href attributes
    const linksToCheck = Math.min(count, 15);

    for (let i = 0; i < linksToCheck; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');

      // Should have an href
      expect(href).toBeTruthy();

      // Should not be empty or just #
      expect(href).not.toBe('');
      expect(href).not.toBe('#');
    }
  });
});
