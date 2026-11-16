import { expect, test, type APIRequestContext } from "@playwright/test";

import { apiAs, payloadOf } from "../support/api";
import {
  createArenaScene,
  openArena,
  openTokenMenu,
  readArena,
  setLiveScene,
} from "../support/arena";
import { GM, PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { loginAs } from "../support/session";

test.describe.configure({ mode: "serial" });

test.describe("arena: tokens dos jogadores", () => {
  let gm: APIRequestContext;
  let previousLive: string | null = null;
  let sceneId = "";

  const ownTokens = async () => {
    const { playerCharacterId } = e2eState();
    return (await readArena(gm, sceneId)).tokens.filter(
      (token) => token.characterId === playerCharacterId,
    );
  };

  test.beforeAll(async () => {
    gm = await apiAs(GM);
    previousLive = (await readArena(gm)).activeSceneId;
    sceneId = (await createArenaScene(gm, "Tokens dos jogadores", [{ name: "Alvo" }])).sceneId;
    await setLiveScene(gm, sceneId);
  });

  test.afterAll(async () => {
    await setLiveScene(gm, previousLive);
    await gm.delete(`/arena/scenes/${sceneId}`);
    await gm.dispose();
  });

  test("o token que o Mestre põe no mapa já se move pelo jogador", async ({ page }) => {
    const { playerCharacterId } = e2eState();
    await loginAs(page, PLAYER);
    await openArena(page);
    const placed = await payloadOf<{ token: { id: string; x: number } }>(
      await gm.post(`/arena/scenes/${sceneId}/tokens`, {
        data: { characterId: playerCharacterId, x: 400, y: 400 },
      }),
    );
    const tray = page.getByRole("navigation", { name: "Meus tokens" });
    await tray.getByRole("button").first().click();
    await page.getByRole("application", { name: /Mapa da cena/ }).focus();
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(async () => (await ownTokens()).find((token) => token.id === placed.token.id)?.x)
      .toBeGreaterThan(placed.token.x);
  });

  test("o jogador põe no mapa um token da própria ficha pelo menu da ficha", async ({ page }) => {
    const { playerCharacterId } = e2eState();
    const { name } = await payloadOf<{ name: string }>(
      await gm.get(`/characters/${playerCharacterId}`),
    );
    const before = (await ownTokens()).length;
    await loginAs(page, PLAYER);
    await openArena(page);
    await page.getByRole("button", { name: `Ações de ${name}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Colocar no mapa" }).click();
    await expect.poll(async () => (await ownTokens()).length).toBe(before + 1);
    expect((await ownTokens()).every((token) => !token.hidden)).toBe(true);
  });

  test("o jogador remove os próprios tokens pelo menu do token", async ({ page }) => {
    const before = (await ownTokens()).length;
    expect(before).toBeGreaterThan(0);
    await loginAs(page, PLAYER);
    await openArena(page);
    const tray = page.getByRole("navigation", { name: "Meus tokens" });
    await tray.getByRole("button").first().click();
    await (await openTokenMenu(page)).getByRole("menuitem", { name: "Remover" }).click();
    await page
      .getByRole("dialog", { name: "Remover token?" })
      .getByRole("button", { name: "Remover" })
      .click();
    await expect.poll(async () => (await ownTokens()).length).toBe(before - 1);
  });

  test("o jogador não cria NPC nem token de ficha alheia pela API", async () => {
    const player = await apiAs(PLAYER);
    const { otherCharacterId } = e2eState();
    expect(
      (
        await player.post(`/arena/scenes/${sceneId}/tokens`, { data: { name: "Intruso" } })
      ).status(),
    ).toBe(403);
    expect(
      (
        await player.post(`/arena/scenes/${sceneId}/tokens`, {
          data: { characterId: otherCharacterId },
        })
      ).status(),
    ).toBe(403);
    const npc = (await readArena(gm, sceneId)).tokens.find((token) => token.characterId === null);
    expect((await player.delete(`/arena/tokens/${npc?.id}`)).status()).toBe(403);
    await player.dispose();
  });
});
