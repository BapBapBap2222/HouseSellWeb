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
    await expect(page).toHaveURL(/\/login$/);
  });

  test('profile favorites tab loads saved listings and removes one', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'test-access-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');
    });

    await page.route('**/api/auth/users/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          username: 'buyer_one',
          email: 'buyer@example.com',
          first_name: 'Buyer',
          last_name: 'One',
          phone: null,
          avatar: null,
          address: null,
          short_intro: null,
          bio: null,
          activity_visible: true,
          created_at: '2026-06-02T00:00:00Z',
          is_staff: false,
          is_superuser: false,
          agent_is_verified: false,
          agent_slug: null,
          verification_status: null,
          verification_message: null,
        }),
      });
    });
    await page.route('**/api/properties/my/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/appointments/owner/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/properties/favorites/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 7,
            property_id: 42,
            property_title: 'Saved river view apartment',
            created_at: '2026-06-02T00:00:00Z',
            property: {
              id: 42,
              title: 'Saved river view apartment',
              property_type: 'apartment',
              property_type_display: 'Apartment',
              listing_type: 'sale',
              listing_type_display: 'For Sale',
              status: 'active',
              status_display: 'Active',
              price: 3200000000,
              area: 80,
              bedrooms: 2,
              bathrooms: 2,
              city: 'Hồ Chí Minh',
              district: 'Quận 1',
              ward: 'Bến Nghé',
              address: '1 Nguyễn Huệ',
              owner_name: 'Seller One',
              owner_phone: null,
              owner_agent_slug: null,
              primary_image: null,
              views_count: 12,
              is_featured: false,
              is_favorited: true,
              created_at: '2026-06-01T00:00:00Z',
            },
          },
        ]),
      });
    });
    await page.route('**/api/properties/42/favorite/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ is_favorited: false }),
      });
    });

    await page.goto(`${BASE_URL}/profile?tab=favorites`);
    await expect(page.getByRole('heading', { name: 'Saved Listings' })).toBeVisible();
    await expect(page.getByText('Saved river view apartment')).toBeVisible();

    await page.getByRole('button', { name: 'Remove saved listing' }).click();
    await expect(page.getByText('Saved river view apartment')).toHaveCount(0);
    await expect(page.getByText('No saved listings yet')).toBeVisible();
  });

  test('profile visibility toggle saves public/private profile setting', async ({ page }) => {
    let profileVisibilityPatch = null;
    let profileVisibleResponse = true;

    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'test-access-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');
    });

    await page.route('**/api/auth/users/me/', async (route) => {
      if (route.request().method() === 'PATCH') {
        profileVisibilityPatch = route.request().postDataJSON();
        profileVisibleResponse = false;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            username: 'seller_one',
            email: 'seller@example.com',
            first_name: 'Seller',
            last_name: 'One',
            phone: null,
            avatar: null,
            address: null,
            short_intro: null,
            bio: null,
            profile_visible: false,
            activity_visible: true,
            created_at: '2026-06-02T00:00:00Z',
            is_staff: false,
            is_superuser: false,
            agent_is_verified: true,
            agent_slug: 'seller-one',
            verification_status: 'approved',
            verification_message: null,
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          username: 'seller_one',
          email: 'seller@example.com',
          first_name: 'Seller',
          last_name: 'One',
          phone: null,
          avatar: null,
          address: null,
          short_intro: null,
          bio: null,
          profile_visible: profileVisibleResponse,
          activity_visible: true,
          created_at: '2026-06-02T00:00:00Z',
          is_staff: false,
          is_superuser: false,
          agent_is_verified: true,
          agent_slug: 'seller-one',
          verification_status: 'approved',
          verification_message: null,
        }),
      });
    });
    await page.route('**/api/properties/my/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/appointments/owner/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto(`${BASE_URL}/profile`);
    await expect(page.getByRole('heading', { name: 'Public Profile' })).toBeVisible();
    await page.locator('[title="Profile is public"]').click();

    await expect.poll(() => profileVisibilityPatch).toEqual({ profile_visible: false });
    await expect(page.locator('[title="Profile is private"]')).toBeVisible();
  });

  test('profile ratings tab shows received rating comments with dates', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'test-access-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');
    });

    await page.route('**/api/auth/users/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          username: 'seller_one',
          email: 'seller@example.com',
          first_name: 'Seller',
          last_name: 'One',
          phone: null,
          avatar: null,
          address: null,
          short_intro: null,
          bio: null,
          profile_visible: true,
          activity_visible: true,
          created_at: '2026-06-02T00:00:00Z',
          is_staff: false,
          is_superuser: false,
          agent_is_verified: true,
          agent_slug: 'seller-one',
          verification_status: 'approved',
          verification_message: null,
        }),
      });
    });
    await page.route('**/api/properties/my/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/appointments/owner/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/agents/me/reviews/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 5,
            agent: 9,
            reviewer: 3,
            reviewer_name: 'Buyer One',
            reviewer_username: 'buyer_one',
            rating: 4,
            comment: 'Helpful seller and quick response.',
            created_at: '2026-06-02T00:00:00Z',
            updated_at: '2026-06-02T00:00:00Z',
          },
        ]),
      });
    });

    await page.goto(`${BASE_URL}/profile?tab=ratings`);
    await expect(page.getByRole('heading', { name: 'Ratings & Comments' })).toBeVisible();
    await expect(page.getByText('Buyer One')).toBeVisible();
    await expect(page.getByText('4/5')).toBeVisible();
    await expect(page.getByText('Helpful seller and quick response.')).toBeVisible();
  });

  test('profile sell tab lets owner pause and delete a listing', async ({ page }) => {
    let pauseRequestBody = null;
    let deleteCalled = false;

    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'test-access-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');
    });

    await page.route('**/api/auth/users/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          username: 'seller_one',
          email: 'seller@example.com',
          first_name: 'Seller',
          last_name: 'One',
          phone: null,
          avatar: null,
          address: null,
          short_intro: null,
          bio: null,
          activity_visible: true,
          created_at: '2026-06-02T00:00:00Z',
          is_staff: false,
          is_superuser: false,
          agent_is_verified: true,
          agent_slug: 'seller-one',
          verification_status: 'approved',
          verification_message: null,
        }),
      });
    });
    await page.route('**/api/properties/my/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 88,
            title: 'Owner controllable listing',
            property_type: 'house',
            property_type_display: 'House',
            listing_type: 'sale',
            listing_type_display: 'For Sale',
            status: 'active',
            status_display: 'Active',
            price: 4500000000,
            area: 96,
            bedrooms: 3,
            bathrooms: 2,
            city: 'Đà Nẵng',
            district: 'Hải Châu',
            ward: null,
            address: '12 Bạch Đằng',
            owner_name: 'Seller One',
            owner_phone: null,
            owner_agent_slug: 'seller-one',
            primary_image: null,
            views_count: 8,
            is_featured: false,
            is_favorited: false,
            is_active: true,
            created_at: '2026-06-01T00:00:00Z',
          },
        ]),
      });
    });
    await page.route('**/api/appointments/owner/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/properties/88/', async (route) => {
      if (route.request().method() === 'PATCH') {
        pauseRequestBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 88,
            title: 'Owner controllable listing',
            status: 'inactive',
            status_display: 'Inactive',
            is_active: false,
          }),
        });
        return;
      }

      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({ status: 204, body: '' });
        return;
      }

      await route.continue();
    });

    page.on('dialog', (dialog) => dialog.accept());

    await page.goto(`${BASE_URL}/profile?tab=sell`);
    await expect(page.getByText('Owner controllable listing')).toBeVisible();

    await page.getByRole('button', { name: /Pause/ }).click();
    await expect.poll(() => pauseRequestBody).toEqual({ status: 'inactive', is_active: false });
    await expect(page.getByText('Hidden')).toBeVisible();

    await page.getByRole('button', { name: /Delete listing/i }).click();
    await expect.poll(() => deleteCalled).toBe(true);
    await expect(page.getByText('Owner controllable listing')).toHaveCount(0);
  });

  test('header Sell link opens public sale listings', async ({ page }) => {
    await page.goto(BASE_URL);
    const sellLink = page.locator('a[href="/listings?type=buy"]').filter({ hasText: 'Sell' }).first();
    await expect(sellLink).toBeVisible();
    await sellLink.click();

    await expect(page).toHaveURL(/\/listings\?type=buy$/);
  });

  test('agent latest activity opens the public property detail page', async ({ page }) => {
    await page.route('**/api/agents/seller-one/reviews/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/agents/seller-one/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 9,
          full_name: 'Seller One',
          slug: 'seller-one',
          avatar_url: '',
          email: 'seller@example.com',
          phone: '0900000000',
          city: 'Hồ Chí Minh',
          specialization: 'Residential sales',
          tagline: 'Trusted seller',
          years_experience: 5,
          total_listings: 2,
          deals_closed: 10,
          rating: '4.8',
          total_reviews: 12,
          is_verified: true,
          response_time: 'Fast',
          areas: ['Hồ Chí Minh'],
          languages: ['Vietnamese'],
          bio: 'Seller bio',
          activity_visible: true,
          latest_activities: [
            {
              id: 123,
              title: 'Clickable activity listing',
              label: 'New listing',
              listing_type: 'For Sale',
              address: '1 Nguyễn Huệ, Quận 1, Hồ Chí Minh',
              created_at: '2026-06-02T00:00:00Z',
              image: null,
            },
          ],
          created_at: '2026-06-01T00:00:00Z',
          updated_at: '2026-06-02T00:00:00Z',
        }),
      });
    });

    await page.goto(`${BASE_URL}/agents/seller-one`);
    await expect(page.getByRole('heading', { name: 'Latest Activity' })).toBeVisible();
    await page.getByRole('link', { name: /Clickable activity listing/ }).click();

    await expect(page).toHaveURL(/\/property\/123$/);
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

  test('explore district links preselect province and district in listings', async ({ page }) => {
    await page.goto(`${BASE_URL}/explore`);

    const provinceLink = page.locator('a[href="/listings?province=ho-chi-minh"]').first();
    await provinceLink.scrollIntoViewIfNeeded();
    await expect(provinceLink).toBeVisible();
    await expect(page.locator('a[href="/listings?province=ho-chi-minh&location=quan-1"]').first()).toBeVisible();
    await expect(page.locator('a[href="/listings?province=ho-chi-minh&location=thanh-pho-thu-duc"]').first()).toBeVisible();

    await page.locator('a[href="/listings?province=ho-chi-minh&location=quan-1"]').first().click();
    await expect(page).toHaveURL(/\/listings\?province=ho-chi-minh&location=quan-1$/);
    await expect(page.locator('[role="combobox"]').nth(1)).toContainText('Quận 1');
  });

  test('listing price preset resets range when unchecked', async ({ page }) => {
    await page.goto(`${BASE_URL}/listings?province=ho-chi-minh`);

    const under2b = page.getByLabel('Under 2B');
    await under2b.click();
    await expect(page.getByText('2B+')).toBeVisible();

    await under2b.click();
    await expect(page.getByText('60B+')).toBeVisible();
  });
});
