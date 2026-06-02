const { test, expect } = require('playwright/test');

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5173';

const publicRoutes = [
  '/',
  '/listings',
  '/agents',
  '/explore',
  '/news',
  '/news/1',
  '/prediction',
  '/privacy',
  '/terms',
];

test.describe('Site audit smoke', () => {
  for (const route of publicRoutes) {
    test(`renders ${route} without dead anchor links`, async ({ page }) => {
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));

      await page.goto(`${BASE_URL}${route}`);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('a[href="#"]')).toHaveCount(0);
      expect(pageErrors).toEqual([]);
    });
  }

  test('protected profile route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).toHaveURL(/\/login/);
  });

  test('home hero CTAs navigate to working pages', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.getByRole('button', { name: 'Discover Location' }).click();
    await expect(page).toHaveURL(/\/explore$/);

    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Open saved listings' }).click();
    await expect(page).toHaveURL(/\/listings$/);
  });
});
