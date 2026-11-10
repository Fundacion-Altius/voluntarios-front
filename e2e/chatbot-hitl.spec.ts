import { test, expect } from "@playwright/test";
import { loginAsBrowser } from "./helpers";

test.describe("Agentic Chatbot HITL Flow", () => {
  test("should show 'Esperando aprobación humana…' and enqueue HITL item for side-effect tool", async ({
    page,
  }) => {
    // Login via the shared E2E helper (handles CSRF + session cookie)
    await loginAsBrowser(page, "admin@fundacionaltius.org", "admin123");

    // Navigate to the chatbot page
    await page.goto("/en/chatbot");
    await expect(page).toHaveURL("/en/chatbot");

    // Send a message that triggers a side-effect tool
    await page.fill(
      "[data-testid=chatbot-input]",
      "envíale un WhatsApp a esa persona"
    );
    await page.click("[data-testid=chatbot-send]");

    // Assistant reply confirms HITL (user bubble also uses chatbot-message-content)
    await expect(
      page.getByTestId("chatbot-message-content").filter({
        hasText: /pendiente de aprobación humana|Esperando aprobación humana/i,
      }),
    ).toBeVisible();

    // Check for the HITL pending notice
    const hitlNotice = page.getByTestId("hitl-pending-notice");
    await expect(hitlNotice).toBeVisible();
    await expect(hitlNotice).toContainText("Esperando aprobación humana");

    // Check for approve/deny buttons
    const approveButton = page.getByTestId("hitl-approve");
    const denyButton = page.getByTestId("hitl-deny");
    await expect(approveButton).toBeVisible();
    await expect(denyButton).toBeVisible();
  });

  test("should allow approving a HITL item", async ({ page }) => {
    // Login via the shared E2E helper
    await loginAsBrowser(page, "admin@fundacionaltius.org", "admin123");

    // Navigate to the chatbot page
    await page.goto("/en/chatbot");
    await expect(page).toHaveURL("/en/chatbot");

    // Send a message that triggers a side-effect tool
    await page.fill(
      "[data-testid=chatbot-input]",
      "envíale un WhatsApp a esa persona"
    );
    await page.click("[data-testid=chatbot-send]");

    // Wait for the HITL notice to appear
    await expect(page.getByTestId("hitl-pending-notice")).toContainText(
      "Esperando aprobación humana"
    );

    // Click approve
    await page.click("[data-testid=hitl-approve]");

    // Check that the notice updates to "Aprobado"
    await expect(page.getByTestId("hitl-pending-notice")).toContainText(
      "Aprobado"
    );
    await expect(page.getByTestId("hitl-approve")).not.toBeVisible();
    await expect(page.getByTestId("hitl-deny")).not.toBeVisible();
  });

  test("should allow denying a HITL item", async ({ page }) => {
    // Login via the shared E2E helper
    await loginAsBrowser(page, "admin@fundacionaltius.org", "admin123");

    // Navigate to the chatbot page
    await page.goto("/en/chatbot");
    await expect(page).toHaveURL("/en/chatbot");

    // Send a message that triggers a side-effect tool
    await page.fill(
      "[data-testid=chatbot-input]",
      "envíale un WhatsApp a esa persona"
    );
    await page.click("[data-testid=chatbot-send]");

    // Wait for the HITL notice to appear
    await expect(page.getByTestId("hitl-pending-notice")).toContainText(
      "Esperando aprobación humana"
    );

    // Click deny
    await page.click("[data-testid=hitl-deny]");

    // Check that the notice updates to "Denegado"
    await expect(page.getByTestId("hitl-pending-notice")).toContainText(
      "Denegado"
    );
    await expect(page.getByTestId("hitl-approve")).not.toBeVisible();
    await expect(page.getByTestId("hitl-deny")).not.toBeVisible();
  });
});
