import AxeBuilder from "@axe-core/playwright";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

import { apiAs, payloadOf } from "../support/api";
import { createArenaScene, openArena, openTokenMenu, setLiveScene } from "../support/arena";
import { GM, PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { dismissRoll, loginAs, openSheet } from "../support/session";
import { test } from "../support/test";

interface TurnOrder {
  round: number;
  currentTokenId: string | null;
  entries: { tokenId: string; initiative: number | null }[];
}

test.describe.configure({ mode: "serial" });

test.describe("arena: ordem de turnos", () => {
  let gm: APIRequestContext;
  let player: APIRequestContext;
  let previousLive: string | null = null;
  let sceneId = "";
  let npcId = "";
  let heroId = "";
  let heroName = "";

  const orderOf = async (api: APIRequestContext): Promise<TurnOrder | null> =>
    (
      await payloadOf<{ turnOrder: TurnOrder | null }>(
        await api.get(api === gm ? `/arena?sceneId=${sceneId}` : "/arena"),
      )
    ).turnOrder;

  const turnWindow = (page: Page) => page.getByRole("dialog", { name: "Turnos" });

  const openTurns = async (page: Page) => {
    await page.getByRole("button", { name: /^Turnos/ }).click();
    await expect(turnWindow(page)).toBeVisible();
    return turnWindow(page);
  };

  test.beforeAll(async () => {
    gm = await apiAs(GM);
    player = await apiAs(PLAYER);
    const { playerCharacterId } = e2eState();
    previousLive = (await payloadOf<{ activeSceneId: string | null }>(await gm.get("/arena")))
      .activeSceneId;
    heroName = (await payloadOf<{ name: string }>(await gm.get(`/characters/${playerCharacterId}`)))
      .name;
    const created = await createArenaScene(gm, "Ordem de turnos", [
      { name: "Goblin", x: 300, y: 300 },
      { characterId: playerCharacterId, x: 600, y: 300 },
    ]);
    sceneId = created.sceneId;
    npcId = created.tokens[0]?.id ?? "";
    heroId = created.tokens[1]?.id ?? "";
    await payloadOf(await gm.patch(`/arena/tokens/${npcId}`, { data: { initiativeBonus: 4 } }));
    await setLiveScene(gm, sceneId);
  });

  test.afterAll(async () => {
    await setLiveScene(gm, previousLive);
    await gm.delete(`/arena/scenes/${sceneId}`);
    await gm.dispose();
    await player.dispose();
  });

  test("o jogador rola Iniciativa na ficha e o token dele entra na ordem", async ({ page }) => {
    await loginAs(page, PLAYER);
    await openSheet(page, e2eState().playerCharacterId);
    await page.getByRole("button", { name: /Rolar Iniciativa/ }).click();
    await expect(page.getByText(/^(Rolagem final|Crítico!)$/)).toBeVisible({ timeout: 8000 });
    await expect
      .poll(async () => (await orderOf(gm))?.entries.find((entry) => entry.tokenId === heroId), {
        timeout: 8000,
      })
      .toMatchObject({ initiative: expect.any(Number) });
    await dismissRoll(page);
  });

  test("o Mestre rola o NPC pelo menu do token e passa os turnos", async ({ page }) => {
    await loginAs(page, GM);
    await openArena(page);
    const turns = await openTurns(page);
    await expect(turns.getByRole("listitem")).toHaveCount(1);
    await page.getByRole("application", { name: /Mapa da cena/ }).focus();
    await page.keyboard.press("Control+a");
    await (await openTokenMenu(page)).getByRole("menuitem", { name: "Rolar iniciativa" }).click();
    await expect(turns.getByRole("listitem")).toHaveCount(2);
    await expect(turns.getByText(/Iniciativa de .*: rolando/).first()).toBeAttached();
    const npcValue = async () =>
      (await orderOf(gm))?.entries.find((entry) => entry.tokenId === npcId)?.initiative ?? null;
    await expect.poll(npcValue, { timeout: 8000 }).not.toBeNull();
    expect(await npcValue()).toBeGreaterThanOrEqual(5);
    expect(await npcValue()).toBeLessThanOrEqual(24);
    await expect(turns.getByText(/: rolando/)).toHaveCount(0);
    await expect(
      page.locator("li").filter({ hasText: heroName }).filter({ hasText: "Iniciativa" }).first(),
    ).toBeVisible();

    await turns.getByRole("button", { name: "Começar" }).click();
    await expect(turns.locator('[aria-current="step"]')).toHaveCount(1);
    const first = (await orderOf(gm))?.currentTokenId;
    expect(first).toBe((await orderOf(gm))?.entries[0]?.tokenId);
    await turns.getByRole("button", { name: "Próximo turno" }).click();
    await turns.getByRole("button", { name: "Próximo turno" }).click();
    await expect(turns.getByText("Rodada 2")).toBeVisible();
    await expect.poll(async () => (await orderOf(gm))?.currentTokenId).toBe(first);
  });

  test("o jogador da vez encerra o próprio turno", async ({ page, browser }) => {
    const gmPage = await (await browser.newContext()).newPage();
    await loginAs(gmPage, GM);
    await openArena(gmPage);
    const gmTurns = await openTurns(gmPage);
    await gmTurns.getByRole("button", { name: `Ações de ${heroName} na ordem` }).click();
    await gmPage.getByRole("menuitem", { name: `Passar a vez para ${heroName}` }).click();
    await expect.poll(async () => (await orderOf(gm))?.currentTokenId).toBe(heroId);

    await loginAs(page, PLAYER);
    await openArena(page);
    await expect(page.getByRole("button", { name: "Turnos (sua vez)" })).toBeVisible();
    const turns = await openTurns(page);
    await expect(turns.getByRole("button", { name: "Próximo turno" })).toHaveCount(0);
    await turns.getByRole("button", { name: "Encerrar meu turno" }).click();
    await expect.poll(async () => (await orderOf(gm))?.currentTokenId).not.toBe(heroId);
    await expect(turns.getByRole("button", { name: "Encerrar meu turno" })).toHaveCount(0);
  });

  test("o jogador não vê na ordem o token que o Mestre oculta", async ({ page }) => {
    await loginAs(page, PLAYER);
    await openArena(page);
    const turns = await openTurns(page);
    await expect(turns.getByRole("listitem")).toHaveCount(2);
    await payloadOf(await gm.patch(`/arena/tokens/${npcId}`, { data: { hidden: true } }));
    await expect(turns.getByRole("listitem")).toHaveCount(1);
    expect((await orderOf(player))?.entries.map((entry) => entry.tokenId)).toEqual([heroId]);
    await payloadOf(await gm.patch(`/arena/tokens/${npcId}`, { data: { hidden: false } }));
    await expect(turns.getByRole("listitem")).toHaveCount(2);
  });

  test("a janela de turnos não tem violações de acessibilidade", async ({ page }) => {
    await loginAs(page, GM);
    await openArena(page);
    await openTurns(page);
    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"])
      .analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });

  test("o Mestre limpa a ordem com confirmação", async ({ page }) => {
    await loginAs(page, GM);
    await openArena(page);
    const turns = await openTurns(page);
    await turns.getByRole("button", { name: "Limpar ordem" }).click();
    await page
      .getByRole("dialog", { name: "Limpar a ordem de turnos?" })
      .getByRole("button", { name: "Limpar" })
      .click();
    await expect(turns.getByRole("listitem")).toHaveCount(0);
    await expect.poll(async () => (await orderOf(gm))?.entries.length).toBe(0);
  });

  test("o jogador rola pelo menu do próprio token e o NPC rola em segredo", async ({
    page,
    browser,
  }) => {
    await loginAs(page, PLAYER);
    await openArena(page);
    await page.getByRole("navigation", { name: "Meus tokens" }).getByRole("button").first().click();
    await (await openTokenMenu(page)).getByRole("menuitem", { name: "Rolar iniciativa" }).click();
    const valueOf = async (tokenId: string) =>
      (await orderOf(gm))?.entries.find((entry) => entry.tokenId === tokenId)?.initiative ?? null;
    await expect.poll(() => valueOf(heroId), { timeout: 8000 }).not.toBeNull();
    expect((await orderOf(gm))?.entries.map((entry) => entry.tokenId)).toEqual([heroId]);
    const feedCard = (name: string) =>
      page.locator("li").filter({ hasText: name }).filter({ hasText: "Iniciativa" });
    await expect(feedCard(heroName).first()).toBeVisible();

    const gmPage = await (await browser.newContext()).newPage();
    await loginAs(gmPage, GM);
    await openArena(gmPage);
    await gmPage.getByRole("application", { name: /Mapa da cena/ }).focus();
    await gmPage.keyboard.press("Control+a");
    await (await openTokenMenu(gmPage)).getByRole("menuitem", { name: "Rolar iniciativa" }).click();
    await expect.poll(() => valueOf(npcId), { timeout: 8000 }).not.toBeNull();
    await expect(feedCard("Goblin")).toHaveCount(0);
  });
});
