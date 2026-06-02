const { test, expect } = require('playwright/test');

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5173';

async function fillValidPredictionForm(page) {
  await page.selectOption('#propertyTypeName', { label: 'Nhà' });
  await page.fill('#area', '80');
  await page.fill('#floorCount', '4');
  await page.fill('#bedroomCount', '3');
  await page.fill('#bathroomCount', '3');
}

async function selectMapLocation(page) {
  const canvas = page.locator('.maplibregl-canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 15000 });
  await canvas.click({ position: { x: 180, y: 160 } });
  await expect(page.getByText(/\d+\.\d{6}/).first()).toBeVisible();
}

test.describe('Prediction smoke', () => {
  test('header exposes Explore and Agents routes', async ({ page }) => {
    await page.goto(BASE_URL);

    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Explore' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Agents' })).toBeVisible();
  });

  test('location selectors expose provinces, districts, and wards', async ({ page }) => {
    await page.goto(`${BASE_URL}/prediction`);

    await expect(page.locator('#province')).toBeVisible();
    await expect(page.locator('#district')).toBeVisible();
    await expect(page.locator('#ward')).toBeVisible();

    await expect.poll(() => page.locator('#province option').count()).toBeGreaterThanOrEqual(64);
    await expect.poll(() => page.locator('#district option').count()).toBeGreaterThan(1);
    await expect.poll(() => page.locator('#ward option').count()).toBeGreaterThan(1);
  });

  test('C05: missing required fields -> no API call and show validation message', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/prediction/', async (route) => {
      requestCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ estimated_price: 1, price_min: 1, price_max: 1, confidence: 0.8, price_per_m2: 1 }),
      });
    });

    await page.goto(`${BASE_URL}/prediction`);

    await page.evaluate(() => {
      const form = document.querySelector('form');
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await expect(page.getByText('Vui lòng nhập đầy đủ thông tin bất động sản bắt buộc.')).toBeVisible();
    expect(requestCount).toBe(0);
  });

  test('C06: valid FE -> BE payload schema and result render', async ({ page }) => {
    let capturedBody = null;

    await page.route('**/api/prediction/', async (route) => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          estimated_price: 5000000000,
          price_min: 4400000000,
          price_max: 5600000000,
          confidence: 0.82,
          price_per_m2: 62500000,
        }),
      });
    });

    await page.goto(`${BASE_URL}/prediction`);
    await fillValidPredictionForm(page);
    await selectMapLocation(page);
    await page.getByRole('button', { name: 'Dự đoán giá nhà' }).click();

    await expect(page.getByRole('heading', { name: 'Kết quả dự đoán' })).toBeVisible();

    expect(capturedBody).toBeTruthy();
    const requiredKeys = [
      'province_name',
      'district_name',
      'ward_name',
      'property_type_name',
      'area',
      'floor_count',
      'bedroom_count',
      'bathroom_count',
      'latitude',
      'longitude',
    ];
    for (const key of requiredKeys) {
      expect(Object.prototype.hasOwnProperty.call(capturedBody, key)).toBeTruthy();
    }
    expect(capturedBody.property_type_name).toBe('Nhà');
    expect(capturedBody.area).toBe(80);
    expect(capturedBody.floor_count).toBe(4);
    expect(capturedBody.bedroom_count).toBe(3);
    expect(capturedBody.bathroom_count).toBe(3);
    expect(capturedBody.latitude).toBeGreaterThan(8);
    expect(capturedBody.longitude).toBeGreaterThan(102);
  });

  test('C07: API network failure -> user-facing error rendered safely', async ({ page }) => {
    await page.route('**/api/prediction/', async (route) => {
      await route.abort('failed');
    });

    await page.goto(`${BASE_URL}/prediction`);
    await fillValidPredictionForm(page);
    await selectMapLocation(page);
    await page.getByRole('button', { name: 'Dự đoán giá nhà' }).click();

    await expect(page.getByText('Không thể kết nối máy chủ dự đoán giá. Vui lòng thử lại sau.')).toBeVisible();
  });
});
