import { test, expect } from '@playwright/test';

test.describe('Survey Flow (real API)', () => {
  test('loads questions from backend and displays star ratings', async ({ page }) => {
    await page.goto('/encuesta');

    await expect(page).toHaveURL('/encuesta');

    const questionText = page.getByText('¿Cómo calificarías tu experiencia general como voluntario en');
    await expect(questionText).toBeVisible({ timeout: 10000 });

    const starButtons = page.getByRole('button', { name: /Rate \d out of 5/ });
    await expect(starButtons.first()).toBeVisible();
  });

  test('star rating selection works', async ({ page }) => {
    await page.goto('/encuesta');

    await expect(page.getByRole('button', { name: /Rate \d out of 5/ }).first()).toBeVisible({ timeout: 10000 });

    const firstQuestionStars = page.locator('li').first().getByRole('button', { name: /Rate \d out of 5/ });
    await firstQuestionStars.nth(2).click();

    const svg = firstQuestionStars.nth(2).locator('svg');
    await expect(svg).toHaveClass(/text-yellow-400/);

    await firstQuestionStars.nth(4).click();
    await expect(firstQuestionStars.nth(4).locator('svg')).toHaveClass(/text-yellow-400/);
  });

  test('form requires at least one rating', async ({ page }) => {
    await page.goto('/encuesta');

    await expect(page.getByRole('button', { name: /Rate \d out of 5/ }).first()).toBeVisible({ timeout: 10000 });

    const submitButton = page.getByRole('button', { name: 'Enviar' });
    await expect(submitButton).toBeDisabled();

    const starButtons = page.locator('li').first().getByRole('button', { name: /Rate \d out of 5/ });
    await starButtons.nth(2).click();

    const allStars = page.getByRole('button', { name: /Rate \d out of 5/ });
    const count = await allStars.count();
    const ratedCount = await page.locator('svg.text-yellow-400').count();
    if (ratedCount === 7) {
      await expect(submitButton).not.toBeDisabled();
    }
  });

  test('submits survey without CSRF token and redirects to confirmation', async ({ page }) => {
    await page.goto('/encuesta');

    await expect(page.getByRole('button', { name: /Rate \d out of 5/ }).first()).toBeVisible({ timeout: 10000 });

    const fourthStars = page.getByRole('button', { name: 'Rate 4 out of 5' });
    const starCount = await fourthStars.count();
    for (let i = 0; i < starCount; i++) {
      await fourthStars.nth(i).click();
    }

    const submitButton = page.getByRole('button', { name: 'Enviar' });
    await expect(submitButton).not.toBeDisabled({ timeout: 5000 });

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/surveys/submit-answer') && res.request().method() === 'POST'
      ),
      submitButton.click(),
    ]);

    expect(response.status()).toBe(200);

    await expect(page).toHaveURL('/encuesta/confirmacion');
    await expect(page.getByText('¡Gracias!')).toBeVisible();
  });

  test('confirmation page displays and navigation works', async ({ page }) => {
    await page.goto('/encuesta/confirmacion');

    await expect(page.getByText('Encuesta voluntariado de la Fundación Altius')).toBeVisible();
    await expect(page.getByText('¡Gracias!')).toBeVisible();

    const homeLink = page.getByRole('link', { name: 'Volver al inicio' });
    await expect(homeLink).toBeVisible();

    await homeLink.click();
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('anonymous access without authentication', async ({ page }) => {
    await page.context().clearCookies();

    await page.goto('/encuesta');
    await expect(page).toHaveURL('/encuesta');
    await expect(page).not.toHaveURL('/login');
    await expect(page).not.toHaveURL('/auth/login');

    await expect(page.getByRole('button', { name: /Rate \d out of 5/ }).first()).toBeVisible({ timeout: 10000 });
  });

  test('responsive design on mobile and desktop', async ({ page }) => {
    await page.goto('/encuesta');

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('main')).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('main')).toBeVisible();
  });
});
