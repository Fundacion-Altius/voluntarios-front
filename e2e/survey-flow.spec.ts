import { test, expect } from '@playwright/test';

// Mock the backend API responses for testing
test.describe('Survey Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the questions API endpoint
    await page.route('**/api/questions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, text: '¿Cómo calificarías tu experiencia general?', surveyID: 1 },
          { id: 2, text: '¿Qué tan satisfecho estás con la organización?', surveyID: 1 },
        ]),
      });
    });

    // Mock the survey submission API endpoint
    await page.route('**/api/surveys/submit-answer', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test('4.1: Survey form loads and displays questions', async ({ page }) => {
    await page.goto('/encuesta');
    
    // Check that the page loads
    await expect(page).toHaveURL('/encuesta');
    
    // Check that questions are displayed
    await expect(page.getByText('¿Cómo calificarías tu experiencia general?')).toBeVisible();
    await expect(page.getByText('¿Qué tan satisfecho estás con la organización?')).toBeVisible();
    
    // Check that star ratings are present
    const starRatings = page.locator('.star-rating');
    await expect(starRatings).toHaveCount(2);
  });

  test('4.2: Star rating selection and state management', async ({ page }) => {
    await page.goto('/encuesta');
    
    // Click on stars and verify selection
    const firstQuestionStars = page.locator('.star-rating').first();
    await firstQuestionStars.locator('button').nth(2).click(); // Select 3 stars
    
    // Verify the star is selected (should be yellow)
    await expect(firstQuestionStars.locator('button').nth(2).locator('svg')).toHaveClass(/text-yellow-400/);
    
    // Click a different star and verify it updates
    await firstQuestionStars.locator('button').nth(4).click(); // Select 5 stars
    await expect(firstQuestionStars.locator('button').nth(4).locator('svg')).toHaveClass(/text-yellow-400/);
  });

  test('4.3: Form validation requires at least one rating', async ({ page }) => {
    await page.goto('/encuesta');
    
    // Try to submit without selecting any ratings
    await page.click('button[type="submit"]');
    
    // Should not navigate away (form should be disabled)
    await expect(page).toHaveURL('/encuesta');
    
    // Select a rating for the first question
    const firstQuestionStars = page.locator('.star-rating').first();
    await firstQuestionStars.locator('button').nth(2).click();
    
    // Now the submit button should be enabled
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).not.toBeDisabled();
  });

  test('4.4: Successful form submission and redirect to confirmation', async ({ page }) => {
    await page.goto('/encuesta');
    
    // Select ratings for all questions
    const starRatings = page.locator('.star-rating');
    for (let i = 0; i < await starRatings.count(); i++) {
      await starRatings.nth(i).locator('button').nth(2).click(); // Select 3 stars for each
    }
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should redirect to confirmation page
    await expect(page).toHaveURL('/encuesta/confirmacion');
    
    // Check confirmation message is displayed
    await expect(page.getByText('¡Gracias!')).toBeVisible();
    await expect(page.getByText('Tu respuesta nos ayudará a seguir prestando el mejor servicio posible.')).toBeVisible();
  });

  test('4.5: Error handling for API failures', async ({ page }) => {
    // Override the questions API to return an error
    await page.route('**/api/questions', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/encuesta');
    
    // Should display error message
    await expect(page.getByText('Error al cargar las preguntas')).toBeVisible();
  });

  test('4.6: Confirmation page display and navigation', async ({ page }) => {
    await page.goto('/encuesta/confirmacion');
    
    // Check confirmation content
    await expect(page.getByText('Encuesta voluntariado de la Fundación Altius')).toBeVisible();
    await expect(page.getByText('¡Gracias!')).toBeVisible();
    
    // Check navigation options
    const homeButton = page.getByRole('button', { name: 'Volver al inicio' });
    await expect(homeButton).toBeVisible();
    
    // Click home button and verify navigation
    await homeButton.click();
    await expect(page).toHaveURL('/');
  });

  test('4.7: Responsive design on different screen sizes', async ({ page }) => {
    await page.goto('/encuesta');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('main')).toBeVisible();
    
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('main')).toBeVisible();
  });

  test('4.8: Anonymous access without authentication', async ({ page }) => {
    // Clear any existing auth cookies
    await page.context().clearCookies();
    
    // Should be able to access survey page without authentication
    await page.goto('/encuesta');
    await expect(page).toHaveURL('/encuesta');
    
    // Should not redirect to login page
    await expect(page).not.toHaveURL('/login');
    await expect(page).not.toHaveURL('/auth/login');
  });
});

test.describe('Survey Flow - Error Scenarios', () => {
  test('Survey submission API error handling', async ({ page }) => {
    // Mock questions API to work
    await page.route('**/api/questions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, text: 'Test question', surveyID: 1 },
        ]),
      });
    });

    // Mock submission API to return error
    await page.route('**/api/surveys/submit-answer', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Submission failed' }),
      });
    });

    await page.goto('/encuesta');
    
    // Select a rating
    await page.locator('.star-rating').first().locator('button').nth(2).click();
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.getByText('Error al enviar la encuesta')).toBeVisible();
    
    // Should stay on the same page
    await expect(page).toHaveURL('/encuesta');
  });
});