import { expect, test } from "@playwright/test";

import { PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { loginAs, openSheet } from "../support/session";

test.describe("modais de criação, edição e exclusão", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, PLAYER);
    await openSheet(page, e2eState().playerCharacterId);
  });

  test("habilidade: valida, cria, cancela edição, edita e exclui com confirmação", async ({
    page,
  }) => {
    await page.locator("#sheet-tab-habilidades").click();
    await page.getByRole("button", { name: "Adicionar" }).first().click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog.getByRole("heading", { name: "Adicionar habilidade" })).toBeVisible();
    await expect(dialog.locator("input[id$='-name']")).toBeFocused();
    await dialog.getByRole("button", { name: "Adicionar" }).click();
    await expect(dialog.getByRole("alert")).toHaveText("Dê um nome para a habilidade.");
    await dialog.locator("input[id$='-name']").fill("Golpe E2E");
    await dialog.locator("input[id$='-dice']").fill("1d");
    await dialog.getByRole("button", { name: "Adicionar" }).click();
    await expect(dialog.getByRole("alert")).toHaveText(/Dado inválido/);
    await dialog.locator("input[id$='-dice']").fill("1d8");
    await dialog.locator("input[id$='-dice']").press("Enter");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Golpe E2E" })).toBeVisible();

    await page.getByRole("button", { name: "Editar Golpe E2E" }).click();
    await page.locator("dialog[open] input[id$='-name']").fill("Descartado");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Golpe E2E" })).toBeVisible();

    await page.getByRole("button", { name: "Editar Golpe E2E" }).click();
    await page.locator("dialog[open] input[id$='-name']").fill("Golpe Editado");
    await page.locator("dialog[open]").getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("heading", { name: "Golpe Editado" })).toBeVisible();

    await page.getByRole("button", { name: "Excluir Golpe Editado" }).click();
    const confirm = page.locator("dialog[open]");
    await expect(confirm).toContainText("não pode ser desfeito");
    await expect(confirm.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await confirm.getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByRole("heading", { name: "Golpe Editado" })).toHaveCount(0);
  });

  test("inventário e traços persistem após recarregar", async ({ page }) => {
    await page.locator("#sheet-tab-inventario").click();
    await page.getByRole("button", { name: "Adicionar item" }).click();
    await page.locator("dialog[open] input[id$='-name']").fill("Corda E2E");
    await page.locator("dialog[open] input[id$='-weight']").fill("6000");
    await page.locator("dialog[open] button[type=submit]").click();
    await expect(page.getByText("Acima da carga máxima.")).toBeVisible();

    await page.locator("#sheet-tab-tracos").click();
    await page.getByRole("button", { name: "Adicionar traço" }).click();
    await page.locator("dialog[open] input[id$='-name']").fill("Teimoso E2E");
    await page.locator("dialog[open] textarea").fill("**Passivo** nunca desiste.");
    await page.locator("dialog[open] button[type=submit]").click();
    await expect(page.locator("strong", { hasText: "Passivo" })).toBeVisible();

    await expect(page.getByText("Salvo")).toBeVisible();
    await page.reload();
    await page.locator("#sheet-tab-inventario").click();
    await expect(page.getByRole("heading", { name: "Corda E2E" })).toBeVisible();
  });
});
