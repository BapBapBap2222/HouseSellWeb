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

  test('home search filters only navigate when Search is submitted', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.getByRole('button', { name: 'Price Range' }).click();
    await page.getByLabel('Under 2B').check();
    await expect(page).not.toHaveURL(/\/listings/);

    await page.getByRole('button', { name: 'Bedrooms' }).click();
    await page.getByRole('button', { name: '3' }).click();
    await expect(page).not.toHaveURL(/\/listings/);

    await page.getByPlaceholder('Enter area, street, project…').fill('Thao Dien');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page).toHaveURL(/\/listings\?/);
    await expect(page).toHaveURL(/search=Thao\+Dien/);
    await expect(page).toHaveURL(/price=0-2/);
    await expect(page).toHaveURL(/bedrooms=3/);
  });

  test('home location cards link to filtered listings', async ({ page }) => {
    await page.goto(BASE_URL);

    const hcmCard = page.locator('a[href="/listings?province=ho-chi-minh"]').first();
    await hcmCard.scrollIntoViewIfNeeded();
    await expect(hcmCard).toBeVisible();
    await hcmCard.click();
    await expect(page).toHaveURL(/\/listings\?province=ho-chi-minh$/);
    await expect(page.getByText('Hồ Chí Minh').first()).toBeVisible();
  });

  test('listings search box reflects and updates query search', async ({ page }) => {
    await page.goto(`${BASE_URL}/listings?search=Thao%20Dien&province=ho-chi-minh`);

    const searchBox = page.getByPlaceholder('Search by title, street, district, province...');
    await expect(searchBox).toHaveValue('Thao Dien');
    await searchBox.fill('District 1');
    await page.getByRole('button', { name: /^Search$/ }).click();

    await expect(page).toHaveURL(/search=District\+1/);
    await expect(page).toHaveURL(/province=ho-chi-minh/);
  });
});
