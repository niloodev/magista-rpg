import { expect, test } from "@playwright/test";

import { GM, PLAYER } from "../support/env";
import { loginAs } from "../support/session";

test.describe("autenticação", () => {
  test("visitante sem sessão é mandado para o login", async ({ page }) => {
    await page.goto("/mesa");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Magista/);
  });

  test("valida campos vazios e credenciais erradas", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.click("button[type=submit]");
    await expect(page.getByText("Preencha todos os campos.")).toBeVisible();
    await page.fill("#login-character", GM.login);
    await page.fill("#login-password", "senha-errada");
    await page.click("button[type=submit]");
    await expect(page.getByText("Conta ou senha inválidos.")).toBeVisible();
  });

  test("mostra e oculta a senha", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Mostrar senha" }).click();
    await expect(page.locator("#login-password")).toHaveAttribute("type", "text");
  });

  test("entra, sai e a sessão antiga deixa de valer", async ({ page }) => {
    await loginAs(page, GM);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(GM.login);
    await page.getByRole("button", { name: "Sair" }).click();
    await page.waitForURL("**/login");
    await page.goto("/mesa");
    await page.waitForURL("**/login");
  });

  test("acesso rápido de teste entra como Mestre ou personagem (quando ligado)", async ({
    page,
  }) => {
    await page.goto("/login");
    const gmButton = page.getByRole("button", { name: "Entrar como Mestre" });
    test.skip(
      (await gmButton.count()) === 0,
      "NEXT_PUBLIC_DEV_QUICK_LOGIN desligado neste ambiente",
    );
    await gmButton.click();
    await page.waitForURL("**/mesa");
    await expect(page.locator("a[href^='/ficha/']").first()).toBeVisible();
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByRole("button", { name: "Entrar como personagem" }).click();
    await page.waitForURL(/\/(mesa|ficha)/);
    await expect(page.getByText(PLAYER.login).first()).toBeVisible();
  });
});
