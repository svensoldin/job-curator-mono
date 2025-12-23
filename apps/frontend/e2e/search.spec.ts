import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  // Auth
  await page.goto('/');
  await page.getByRole('link', { name: 'Get Started Free' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page
    .getByRole('textbox', { name: 'Email address' })
    .fill('test@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('123456');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Search
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await page
    .getByRole('textbox', { name: /developer/i })
    .fill('frontend developer');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  const location = page.getByRole('textbox', { name: /remote/i });
  await location.click();
  await location.fill('remote');
  await location.press('Enter');

  const skills = page.getByRole('textbox', { name: /react/i });
  await skills.fill('react, typescript');
  await skills.press('Enter');

  await page.getByRole('textbox', { name: 'e.g., 45, 60,' }).fill('55');
  await page.getByRole('textbox', { name: 'e.g., 45, 60,' }).press('Enter');
  await page.getByRole('button', { name: 'Search Jobs' }).click();

  // Wait for loading animation to disappear
  await page.waitForSelector('.animate-spin', {
    state: 'hidden',
    timeout: 60000,
  });

  const heading = page.getByRole('heading');

  expect(heading).toHaveText(/started/i);
});
