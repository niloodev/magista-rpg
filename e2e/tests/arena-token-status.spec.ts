import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

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

const NPC = "Goblin de teste";

const ROLLS_PANEL = 340;

const SIDEBAR = 360;

interface StatusView {
  statuses: Record<string, { health: { current: number | null; max: number | null } }>;
}

async function statusesOf(api: APIRequestContext): Promise<StatusView["statuses"]> {
  return payloadOf<StatusView>(await api.get("/arena")).then((view) => view.statuses);
}

async function selectAll(page: Page): Promise<void> {
  const stage = page.getByRole("application", { name: /Mapa da cena/ });
  await stage.focus();
  await page.keyboard.press("Control+a");
}

test.describe("arena: vida, sanidade e Aplicar mudança", () => {
  let gm: APIRequestContext;
  let player: APIRequestContext;
  let previousLive: string | null = null;
  let npcScene = "";
  let npcId = "";

  test.beforeAll(async () => {
    gm = await apiAs(GM);
    player = await apiAs(PLAYER);
    previousLive = (await readArena(gm)).activeSceneId;
    const created = await createArenaScene(gm, "Status de teste", [{ name: NPC }]);
    npcScene = created.sceneId;
    npcId = created.tokens[0]?.id ?? "";
    await setLiveScene(gm, npcScene);
  });

  test.afterAll(async () => {
    await setLiveScene(gm, previousLive);
    await gm.delete(`/arena/scenes/${npcScene}`);
    await gm.dispose();
    await player.dispose();
  });

  test("o Mestre dá vida ao token avulso e libera o status para o jogador", async ({ page }) => {
    expect(await statusesOf(player)).not.toHaveProperty(npcId);
    await loginAs(page, GM);
    await openArena(page);
    await selectAll(page);
    await (await openTokenMenu(page)).getByRole("menuitem", { name: "Configurar" }).click();
    const dialog = page.getByRole("dialog", { name: "Configurações do token" });
    await dialog.getByLabel("Vida atual").fill("8");
    await dialog.getByLabel("Vida máxima").fill("20");
    await dialog.getByRole("checkbox", { name: PLAYER.login, exact: true }).check();
    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(dialog).toBeHidden();
    await expect
      .poll(async () => (await statusesOf(player))[npcId]?.health)
      .toEqual({ current: 8, max: 20 });
  });

  test("o jogador vê o status, aplica dano pelo menu e perde o status ao ser desmarcado", async ({
    page,
  }) => {
    await gm.patch(`/arena/tokens/${npcId}`, {
      data: { status: { health: { current: 8, max: 20 } }, statusViewerIds: [] },
    });
    const me = await payloadOf<{ account: { id: string } }>(await player.get("/auth/me"));
    await gm.patch(`/arena/tokens/${npcId}`, { data: { statusViewerIds: [me.account.id] } });
    await loginAs(page, PLAYER);
    await openArena(page);
    await selectAll(page);
    const readout = page.getByRole("img", { name: "Vida 8/20" });
    await expect(readout).toBeVisible();

    await page.keyboard.press("m");
    const menu = page.getByRole("dialog", { name: "Aplicar mudança" });
    await expect(menu).toBeVisible();
    await menu.getByText("Causar dano", { exact: true }).click();
    await menu.getByText("Vida", { exact: true }).click();
    await menu.getByLabel("Valor", { exact: true }).fill("3");
    await menu.getByRole("button", { name: "Causar 3 de dano na vida" }).click();
    await expect(menu).toBeHidden();
    await expect
      .poll(async () => (await statusesOf(gm))[npcId]?.health)
      .toEqual({ current: 5, max: 20 });
    await expect(page.getByRole("img", { name: "Vida 5/20" })).toBeVisible();

    await gm.patch(`/arena/tokens/${npcId}`, { data: { statusViewerIds: [] } });
    await expect(page.getByRole("img", { name: /^Vida / })).toHaveCount(0);
  });

  test("o jogador aplica dano na própria ficha pelo menu do botão direito no token", async ({
    page,
  }) => {
    const { playerCharacterId } = e2eState();
    const own = await payloadOf<{ token: { id: string } }>(
      await gm.post(`/arena/scenes/${npcScene}/tokens`, {
        data: { characterId: playerCharacterId, x: 300, y: 300 },
      }),
    );
    const sheetHealth = async () =>
      (
        await payloadOf<{ sheet: { resources: { health: { current: number } } } }>(
          await gm.get(`/characters/${playerCharacterId}`),
        )
      ).sheet.resources.health.current;
    const before = await sheetHealth();
    try {
      await loginAs(page, PLAYER);
      await openArena(page);
      await page.getByRole("navigation", { name: "Meus tokens" }).getByRole("button").click();
      const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
      const center = {
        x: ROLLS_PANEL + (viewport.width - ROLLS_PANEL - SIDEBAR) / 2,
        y: 56 + (viewport.height - 56) / 2,
      };
      await page.mouse.click(center.x, center.y, { button: "right" });
      await page
        .getByRole("menu", { name: /^Ações de/ })
        .getByRole("menuitem", { name: "Aplicar mudança" })
        .click();
      const menu = page.getByRole("dialog", { name: "Aplicar mudança" });
      await expect(menu).toBeVisible();
      await menu.getByText("Causar dano", { exact: true }).click();
      await menu.getByLabel("Valor", { exact: true }).fill("4");
      await menu.getByLabel("Valor", { exact: true }).press("Enter");
      await expect(menu).toBeHidden();
      await expect.poll(sheetHealth).toBe(Math.max(before - 4, 0));
    } finally {
      await gm.delete(`/arena/tokens/${own.token.id}`);
    }
  });

  test("o seletor de efeitos filtra a biblioteca e guarda a escolha", async ({ page }) => {
    await loginAs(page, GM);
    await openArena(page);
    await selectAll(page);
    await page.keyboard.press("m");
    const menu = page.getByRole("dialog", { name: "Aplicar mudança" });
    await menu.getByRole("button", { name: /Trocar efeito/ }).click();
    const picker = page.getByRole("dialog", { name: "Escolher efeito" });
    await picker.getByRole("searchbox", { name: "Buscar efeito" }).fill("brasa");
    await expect(picker.getByText("1 efeito")).toBeVisible();
    await picker.getByText("Brasa viva", { exact: true }).first().click();
    await picker.getByRole("button", { name: "Usar efeito" }).click();
    await expect(picker).toBeHidden();
    await expect(
      menu.getByRole("button", { name: "Efeito: Brasa viva. Trocar efeito" }),
    ).toBeVisible();
  });
});
