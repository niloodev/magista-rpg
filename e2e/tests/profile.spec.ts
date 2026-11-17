import { expect, request, type APIRequestContext } from "@playwright/test";

import { apiAs } from "../support/api";
import { API_URL, GM, PLAYER, WEB_URL } from "../support/env";
import { loginAs } from "../support/session";
import { test } from "../support/test";

const PROFILE_ACCOUNT = { login: "e2e-perfil", password: "senha-e2e-original" };

const NEW_PASSWORD = "senha-e2e-temporaria";

async function signIn(password: string): Promise<APIRequestContext | null> {
  const api = await request.newContext({ baseURL: API_URL, extraHTTPHeaders: { Origin: WEB_URL } });
  const response = await api.post("/auth/login", {
    data: { login: PROFILE_ACCOUNT.login, password },
  });
  if (response.ok()) return api;
  await api.dispose();
  return null;
}

/**
 * Leaves the dedicated test account with its original password (creating it on the first run).
 */
async function resetProfileAccount(): Promise<void> {
  const original = await signIn(PROFILE_ACCOUNT.password);
  if (original) {
    await original.dispose();
    return;
  }
  const gm = await apiAs(GM);
  await gm.post("/accounts", { data: PROFILE_ACCOUNT });
  await gm.dispose();
  const changed = await signIn(NEW_PASSWORD);
  if (!changed) return;
  await changed.put("/auth/password", {
    data: { currentPassword: NEW_PASSWORD, newPassword: PROFILE_ACCOUNT.password },
  });
  await changed.dispose();
}

test.describe("perfil na mesa", () => {
  test.beforeAll(resetProfileAccount);
  test.afterAll(resetProfileAccount);

  test("mostra a conta, troca a senha mantendo esta aba e derruba as outras sessões", async ({
    page,
    browser,
  }) => {
    const other = await (await browser.newContext()).newPage();
    await loginAs(other, PROFILE_ACCOUNT);
    await loginAs(page, PROFILE_ACCOUNT);
    const sibling = await page.context().newPage();
    await sibling.goto("/mesa");
    await expect(sibling.getByText("Conectado", { exact: true })).toBeVisible();
    await page.bringToFront();
    await page.getByRole("button", { name: "Perfil" }).click();
    const dialog = page.getByRole("dialog", { name: "Perfil" });
    await expect(dialog).toContainText(PROFILE_ACCOUNT.login);
    await expect(dialog).toContainText("Jogador");

    await dialog.getByLabel("Senha atual").fill("senha-errada-123");
    await dialog.getByLabel("Nova senha", { exact: true }).fill(NEW_PASSWORD);
    await dialog.getByLabel("Confirmar nova senha").fill(NEW_PASSWORD);
    await dialog.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(dialog.getByRole("alert")).toHaveText("Senha atual incorreta.");
    await expect(dialog.getByLabel("Senha atual")).toBeFocused();

    await dialog.getByLabel("Senha atual").fill(PROFILE_ACCOUNT.password);
    await dialog.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(dialog.getByRole("status")).toContainText("Senha alterada");
    await page.keyboard.press("Escape");
    await expect(page.getByText("Conectado", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(PROFILE_ACCOUNT.login);
    await other.waitForURL("**/login");
    await expect(sibling.getByText("Conectado", { exact: true })).toBeVisible();
  });

  test("modo performance vale para o aparelho e já vem no HTML do servidor", async ({ page }) => {
    await loginAs(page, PLAYER);
    await page.getByRole("button", { name: "Perfil" }).click();
    const toggle = page.getByRole("checkbox", { name: "Modo performance" });
    await expect(toggle).not.toBeChecked();
    await toggle.check();
    await expect(page.locator("html")).toHaveAttribute("data-perf", "low");
    const html = await (await page.request.get("/mesa")).text();
    expect(html).toMatch(/<html[^>]*data-perf="low"/);
    await page.keyboard.press("Escape");
    await page.reload();
    const panel = page.locator("main .backdrop-blur-sm").first();
    await expect(panel).toHaveCSS("backdrop-filter", "none");
    await page.getByRole("button", { name: "Perfil" }).click();
    await expect(toggle).toBeChecked();
    await toggle.uncheck();
    await expect(page.locator("html")).toHaveAttribute("data-perf", "full");
    await expect(panel).not.toHaveCSS("backdrop-filter", "none");
  });
});
