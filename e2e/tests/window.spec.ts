import { expect, test } from "@playwright/test";

import { apiAs, payloadOf, type CharacterSummary } from "../support/api";
import { GM, PLAYER } from "../support/env";
import { loginAs, openSheet } from "../support/session";

async function playerCharacterId(): Promise<string> {
  const player = await apiAs(PLAYER);
  const [character] = await payloadOf<CharacterSummary[]>(await player.get("/characters"));
  await player.dispose();
  if (!character) throw new Error("O jogador do seed não tem ficha liberada.");
  return character.id;
}

test.describe("ficha em janela", () => {
  test("abre a ficha numa janela própria, sem a moldura da página", async ({ page }) => {
    const id = await playerCharacterId();
    await loginAs(page, PLAYER);
    await openSheet(page, id);
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("button", { name: "Abrir em janela" }).click();
    const popup = await popupPromise;
    await popup.waitForURL(`**/janela/ficha/${id}`);
    await expect(popup.getByText("Mesa conectada")).toBeVisible();
    await expect(popup.locator("[data-skeleton-region]")).toHaveCount(0);
    await expect(popup.getByRole("link", { name: "Voltar para a mesa" })).toHaveCount(0);
    await expect(popup.getByRole("button", { name: "Abrir em janela" })).toHaveCount(0);
    await expect(popup.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("edição na janela aparece na aba principal em tempo real", async ({ page }) => {
    const id = await playerCharacterId();
    await loginAs(page, PLAYER);
    await openSheet(page, id);
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("button", { name: "Abrir em janela" }).click();
    const popup = await popupPromise;
    await expect(popup.locator("[data-skeleton-region]")).toHaveCount(0);
    await expect(popup.getByText("Mesa conectada")).toBeVisible();

    const note = `janela ${Date.now().toString(36)}`;
    await popup.getByRole("button", { name: "Editar identidade" }).click();
    await popup.getByLabel("Variação").fill(note);
    await popup.getByRole("button", { name: "Salvar" }).click();
    await expect(popup.getByText("Salvo", { exact: true })).toBeVisible();
    await expect(page.getByText(note)).toBeVisible();
  });

  test("a biblioteca abre a ficha em janela pela linha, para Mestre e jogador", async ({
    page,
  }) => {
    const id = await playerCharacterId();
    for (const account of [GM, PLAYER]) {
      await loginAs(page, account);
      const button = page
        .locator(`li:has(a[href='/ficha/${id}'])`)
        .last()
        .getByRole("button", {
          name: /em janela$/,
        });
      const popupPromise = page.waitForEvent("popup");
      await button.click();
      const popup = await popupPromise;
      await popup.waitForURL(`**/janela/ficha/${id}`);
      await popup.close();
      await page.context().clearCookies();
    }
  });
});
