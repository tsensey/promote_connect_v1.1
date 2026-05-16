import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Bienvenue');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
  });

  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/feed');
    await page.waitForURL('**/login**');
    await expect(page.locator('h1')).toContainText('Bienvenue');
  });
});

test.describe('Public pages', () => {
  test('home page redirects to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/login');
  });
});
