import { expect, test } from "@playwright/test";

import { apiAs } from "../support/api";
import { GM, PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { dismissRoll, loginAs, openSheet } from "../support/session";

test.describe("subida de nível", () => {
  test("jogador fica bloqueado na tela e na API", async ({ page }) => {
    const { playerCharacterId } = e2eState();
    await loginAs(page, PLAYER);
    await openSheet(page, playerCharacterId);
    await expect(page.getByRole("button", { name: "Subir de nível" })).toBeDisabled();
    await expect(page.getByRole("textbox", { name: "Vida máxima" })).toBeDisabled();
    await page.getByRole("button", { name: "Editar identidade" }).click();
    await expect(page.locator("dialog[open] select[id$='-class']")).toBeDisabled();
    await expect(page.locator("dialog[open] input[id$='-level']")).toBeDisabled();
    await page.keyboard.press("Escape");
    const api = await apiAs(PLAYER);
    const response = await api.post(`/characters/${playerCharacterId}/level-up`, {
      data: { addToCurrent: true },
    });
    expect(response.status()).toBe(403);
    await api.dispose();
  });

  test("Mestre sobe o nível, rola vida e sanidade e o jogador vê ao vivo", async ({ browser }) => {
    const { playerCharacterId } = e2eState();
    const player = await (await browser.newContext()).newPage();
    await loginAs(player, PLAYER);
    await openSheet(player, playerCharacterId);
    const levelBefore = Number(await player.locator("dt:text-is('Nível') + dd").innerText());
    const gm = await (await browser.newContext()).newPage();
    await loginAs(gm, GM);
    await openSheet(gm, playerCharacterId);
    const maxBefore = Number(await gm.getByRole("textbox", { name: "Vida máxima" }).inputValue());
    await gm.getByRole("button", { name: "Subir de nível" }).click();
    await gm
      .locator("dialog[open]")
      .getByRole("button", { name: /Rolar e subir/ })
      .click();
    await expect(gm.getByText(/^(Rolagem final|Crítico!)$/)).toBeVisible({ timeout: 8000 });
    await dismissRoll(gm);
    await expect(player.locator("dt:text-is('Nível') + dd")).toHaveText(String(levelBefore + 1));
    expect(
      Number(await gm.getByRole("textbox", { name: "Vida máxima" }).inputValue()),
    ).toBeGreaterThan(maxBefore);
    await expect(player.locator("aside ol > li").first()).toContainText("Subida de nível", {
      timeout: 8000,
    });
  });
});

test("edição pendente do jogador durante a subida de nível não trava a ficha", async ({
  browser,
}) => {
  const { playerCharacterId } = e2eState();
  const player = await (await browser.newContext()).newPage();
  await loginAs(player, PLAYER);
  await openSheet(player, playerCharacterId);
  const levelBefore = Number(await player.locator("dt:text-is('Nível') + dd").innerText());
  const gm = await apiAs(GM);
  await player.getByRole("button", { name: "Editar identidade" }).click();
  await player.locator("dialog[open] input[id$='-variant']").fill("Editado durante o level up");
  await player.locator("dialog[open] button[type=submit]").click();
  const response = await gm.post(`/characters/${playerCharacterId}/level-up`, {
    data: { addToCurrent: false },
  });
  expect(response.ok()).toBe(true);
  await expect(player.getByText("Salvo")).toBeVisible({ timeout: 10_000 });
  await expect(player.getByText("Erro ao salvar")).toHaveCount(0);
  await expect(player.locator("dt:text-is('Nível') + dd")).toHaveText(String(levelBefore + 1));
  await player.reload();
  await expect(player.locator("dt:text-is('Variação') + dd")).toHaveText(
    "Editado durante o level up",
  );
  await expect(player.locator("dt:text-is('Nível') + dd")).toHaveText(String(levelBefore + 1));
  await gm.dispose();
});
