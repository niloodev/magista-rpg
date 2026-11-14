import { expect, type Page } from "@playwright/test";

/**
 * Logs in through the real login form and waits for the table page.
 */
export async function loginAs(
  page: Page,
  credentials: { login: string; password: string },
): Promise<void> {
  await page.goto("/login");
  await expect(page.locator("#login-character")).toBeEditable();
  await page.waitForLoadState("networkidle");
  await page.fill("#login-character", credentials.login);
  await page.fill("#login-password", credentials.password);
  await page.click("button[type=submit]");
  await page.waitForURL("**/mesa");
}

/**
 * Opens a character sheet and waits for the live table connection.
 */
export async function openSheet(page: Page, characterId: string): Promise<void> {
  await page.goto(`/ficha/${characterId}`);
  await expect(page.getByText("Mesa conectada")).toBeVisible();
}

/**
 * Closes the dice animation if it is open.
 */
export async function dismissRoll(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Fechar (Esc)" })).toHaveCount(0);
}
