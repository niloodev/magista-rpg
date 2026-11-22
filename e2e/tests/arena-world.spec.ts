import { expect, type APIRequestContext } from "@playwright/test";

import { apiAs, payloadOf } from "../support/api";
import { openArena, setLiveScene } from "../support/arena";
import { GM, PLAYER } from "../support/env";
import { loginAs } from "../support/session";
import { test } from "../support/test";

interface WorldView {
  activeSceneId: string | null;
  worldLive: boolean;
  world: { party: { x: number; y: number }; fog: string; fogVersion: number } | null;
}

const readWorld = async (api: APIRequestContext, preview = false) =>
  payloadOf<WorldView>(await api.get(`/arena${preview ? "?world=1" : ""}`));

const setWorldLive = async (gm: APIRequestContext, live: boolean) =>
  payloadOf(await gm.put("/arena/world/live", { data: { live } }));

test.describe("arena: Mapa Mundi", () => {
  let gm: APIRequestContext;
  let player: APIRequestContext;
  let previous: WorldView;

  test.beforeAll(async () => {
    gm = await apiAs(GM);
    player = await apiAs(PLAYER);
    previous = await readWorld(gm, true);
    await setWorldLive(gm, false);
  });

  test.afterAll(async () => {
    await setLiveScene(gm, previous.activeSceneId);
    if (previous.worldLive) await setWorldLive(gm, true);
    await gm.dispose();
    await player.dispose();
  });

  test("o Mestre abre o Mapa Mundi em prévia e coloca no ar; o jogador move o token do grupo", async ({
    browser,
  }) => {
    const gmPage = await (await browser.newContext()).newPage();
    await loginAs(gmPage, GM);
    await openArena(gmPage);
    await gmPage.getByRole("tab", { name: "Mapas" }).click();
    await gmPage.getByRole("button", { name: "Mapa Mundi", exact: true }).click();
    await expect(gmPage.getByRole("heading", { level: 1, name: "Mapa Mundi" })).toBeVisible();
    await expect(gmPage.getByText("Prévia")).toBeVisible();
    await expect(gmPage.getByRole("region", { name: "Névoa do Mapa Mundi" })).toBeVisible();
    expect((await readWorld(player)).world).toBeNull();

    const playerPage = await (await browser.newContext()).newPage();
    await loginAs(playerPage, PLAYER);
    await openArena(playerPage);
    await expect(playerPage.getByRole("heading", { level: 1, name: "Mapa Mundi" })).toHaveCount(0);

    await gmPage.getByRole("button", { name: "Colocar no ar" }).click();
    await expect(gmPage.getByText("Ao vivo").first()).toBeVisible();
    await expect(playerPage.getByRole("heading", { level: 1, name: "Mapa Mundi" })).toBeVisible();
    await expect(playerPage.getByText("O Mapa Mundi tem só o token do grupo.")).toBeVisible();
    await expect(playerPage.getByRole("region", { name: "Névoa do Mapa Mundi" })).toHaveCount(0);

    const start = (await readWorld(player)).world?.party;
    expect(start).toBeDefined();
    const stage = playerPage.getByRole("application", { name: "Mapa Mundi com o token do grupo" });
    await stage.focus();
    await playerPage.keyboard.press("Control+a");
    for (let step = 0; step < 3; step += 1) await playerPage.keyboard.press("ArrowRight");
    await expect
      .poll(async () => (await readWorld(gm, true)).world?.party.x)
      .toBeGreaterThan(start?.x ?? 0);
    for (let step = 0; step < 3; step += 1) await playerPage.keyboard.press("ArrowLeft");
    await expect.poll(async () => (await readWorld(gm, true)).world?.party.x).toBe(start?.x);

    await gmPage.getByRole("button", { name: "Ações do Mapa Mundi" }).click();
    if (previous.activeSceneId) {
      await gmPage.getByRole("menuitem", { name: "Voltar à cena" }).click();
    } else {
      await gmPage.keyboard.press("Escape");
      await setWorldLive(gm, false);
    }
    await expect(playerPage.getByRole("heading", { level: 1, name: "Mapa Mundi" })).toHaveCount(0);
    expect((await readWorld(player)).worldLive).toBe(false);
  });

  test("o Mestre cobre e revela o mapa inteiro com a névoa", async ({ browser }) => {
    const empty = (await readWorld(gm, true)).world;
    test.skip(
      !empty || /[^A=]/.test(empty.fog),
      "A névoa já tem regiões pintadas; o teste não apaga o trabalho do Mestre.",
    );
    const gmPage = await (await browser.newContext()).newPage();
    await loginAs(gmPage, GM);
    await openArena(gmPage);
    await gmPage.getByRole("tab", { name: "Mapas" }).click();
    await gmPage.getByRole("button", { name: "Mapa Mundi", exact: true }).click();
    const tools = gmPage.getByRole("region", { name: "Névoa do Mapa Mundi" });
    await expect(tools).toBeVisible();

    const hide = tools.getByRole("button", { name: "Esconder", exact: true });
    await hide.click();
    await expect(hide).toHaveAttribute("aria-pressed", "true");
    await tools.getByRole("checkbox", { name: "Ver como os jogadores" }).check();

    const before = empty?.fogVersion ?? 0;
    await tools.getByRole("button", { name: "Esconder tudo" }).click();
    await gmPage
      .getByRole("dialog", { name: "Esconder o mapa inteiro?" })
      .getByRole("button", { name: "Esconder tudo" })
      .click();
    await expect.poll(async () => (await readWorld(gm, true)).world?.fogVersion).toBe(before + 1);
    expect((await readWorld(gm, true)).world?.fog).toMatch(/[^A=]/);

    await tools.getByRole("button", { name: "Revelar tudo" }).click();
    await gmPage
      .getByRole("dialog", { name: "Revelar o mapa inteiro?" })
      .getByRole("button", { name: "Revelar tudo" })
      .click();
    await expect.poll(async () => (await readWorld(gm, true)).world?.fogVersion).toBe(before + 2);
    expect((await readWorld(gm, true)).world?.fog).toMatch(/^A+=*$/);
  });
});
