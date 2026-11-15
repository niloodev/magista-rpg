import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext } from "@playwright/test";

import { apiAs } from "../support/api";
import {
  createArenaScene,
  openArena,
  readArena,
  setLiveScene,
  type ArenaToken,
} from "../support/arena";
import { GM, PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { loginAs } from "../support/session";

const SCENE = "Arena de teste";

test.describe("arena", () => {
  let gm: APIRequestContext;
  let player: APIRequestContext;
  let previousLive: string | null = null;
  let sceneId = "";
  let own: ArenaToken;

  test.beforeAll(async () => {
    gm = await apiAs(GM);
    player = await apiAs(PLAYER);
    previousLive = (await readArena(gm)).activeSceneId;
    const { playerCharacterId, otherCharacterId } = e2eState();
    const created = await createArenaScene(gm, SCENE, [
      { characterId: playerCharacterId, x: 600, y: 400, size: 160 },
      { characterId: otherCharacterId, x: 900, y: 500 },
      { name: "Lobo", x: 300, y: 300 },
      { name: "Emboscada", x: 200, y: 600, hidden: true },
    ]);
    sceneId = created.sceneId;
    const first = created.tokens[0];
    if (!first) throw new Error("Token do jogador não foi criado");
    own = first;
    await setLiveScene(gm, sceneId);
  });

  test.afterAll(async () => {
    await setLiveScene(gm, previousLive);
    await gm.delete(`/arena/scenes/${sceneId}`);
    await gm.dispose();
    await player.dispose();
  });

  test("o jogador vê a cena no ar sem os tokens ocultos e só controla o seu", async ({ page }) => {
    await loginAs(page, PLAYER);
    await openArena(page);
    await expect(page.getByRole("heading", { level: 1, name: SCENE })).toBeVisible();
    await expect(
      page.getByRole("application", { name: `Mapa da cena ${SCENE}, 3 tokens` }),
    ).toBeVisible();
    const tray = page.getByRole("navigation", { name: "Meus tokens" });
    await expect(tray.getByRole("button")).toHaveCount(1);
    await expect(tray.getByRole("button", { name: own.name })).toBeVisible();
    const view = await readArena(player);
    expect(view.tokens.map((token) => token.name)).not.toContain("Emboscada");
  });

  test("o jogador move o próprio token pelo teclado", async ({ page }) => {
    await loginAs(page, PLAYER);
    await openArena(page);
    const before = (await readArena(gm, sceneId)).tokens.find((token) => token.id === own.id);
    await page.getByRole("navigation", { name: "Meus tokens" }).getByRole("button").click();
    const stage = page.getByRole("application", { name: /Mapa da cena/ });
    await stage.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Shift+ArrowDown");
    await expect(page.getByText(`${own.name} movido.`)).toBeAttached();
    await expect
      .poll(async () => (await readArena(gm, sceneId)).tokens.find((token) => token.id === own.id))
      .toMatchObject({ x: (before?.x ?? 0) + 20, y: (before?.y ?? 0) + 50 });
  });

  test("o jogador arrasta o próprio token com o mouse", async ({ page }) => {
    await loginAs(page, PLAYER);
    await openArena(page);
    const before = (await readArena(gm, sceneId)).tokens.find((token) => token.id === own.id);
    await page.getByRole("navigation", { name: "Meus tokens" }).getByRole("button").click();
    const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
    const center = { x: viewport.width / 2, y: 56 + (viewport.height - 56) / 2 };
    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.mouse.move(center.x + 60, center.y + 40, { steps: 6 });
    await page.mouse.move(center.x + 120, center.y + 80, { steps: 6 });
    await page.mouse.up();
    await expect
      .poll(
        async () => (await readArena(gm, sceneId)).tokens.find((token) => token.id === own.id)?.x,
      )
      .toBeGreaterThan((before?.x ?? 0) + 20);
  });

  test("o Mestre vê os ocultos e a cena sai do ar ao vivo para o jogador", async ({ browser }) => {
    const gmPage = await (await browser.newContext()).newPage();
    await loginAs(gmPage, GM);
    await openArena(gmPage);
    await expect(
      gmPage.getByRole("application", { name: `Mapa da cena ${SCENE}, 4 tokens` }),
    ).toBeVisible();
    await expect(
      gmPage.getByRole("navigation", { name: "Tokens da cena" }).getByRole("button"),
    ).toHaveCount(4);

    const playerPage = await (await browser.newContext()).newPage();
    await loginAs(playerPage, PLAYER);
    await openArena(playerPage);
    await setLiveScene(gm, null);
    await expect(playerPage.getByRole("heading", { name: "Nenhuma cena no ar" })).toBeVisible();
    await setLiveScene(gm, sceneId);
    await expect(playerPage.getByRole("heading", { level: 1, name: SCENE })).toBeVisible();
  });

  test("a Arena não tem violações de acessibilidade", async ({ page }) => {
    await loginAs(page, PLAYER);
    await openArena(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"])
      .analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });
});
