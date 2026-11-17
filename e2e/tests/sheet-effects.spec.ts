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
import { loginAs, openSheet } from "../support/session";
import { writeLists } from "../support/sheet";

interface StoredEffects {
  sheet: { effects?: { damage?: { health?: string } } };
}

test.describe("ficha: animações preferidas", () => {
  let gm: APIRequestContext;
  let previousLive: string | null = null;
  let sceneId = "";

  test.beforeAll(async () => {
    gm = await apiAs(GM);
    previousLive = (await readArena(gm)).activeSceneId;
    const { playerCharacterId } = e2eState();
    const created = await createArenaScene(gm, "Animações de teste", [
      { characterId: playerCharacterId, x: 300, y: 300 },
      { characterId: playerCharacterId, x: 520, y: 300 },
    ]);
    sceneId = created.sceneId;
    await setLiveScene(gm, sceneId);
  });

  test.afterAll(async () => {
    await writeLists({ effects: {} });
    await setLiveScene(gm, previousLive);
    await gm.delete(`/arena/scenes/${sceneId}`);
    await gm.dispose();
  });

  test("o jogador escolhe a animação de dano na vida e o Automático da Arena passa a usá-la", async ({
    page,
  }) => {
    const { playerCharacterId } = e2eState();
    await loginAs(page, PLAYER);
    await openSheet(page, playerCharacterId);
    await page.getByRole("button", { name: "Animações" }).click();
    const dialog = page.getByRole("dialog", { name: "Animações" });
    await expect(dialog.getByText("Automático (Golpe)")).toBeVisible();
    await dialog.getByRole("button", { name: "Trocar efeito: Dano na vida" }).click();
    const picker = page.getByRole("dialog", { name: "Escolher efeito" });
    await picker.getByRole("searchbox", { name: "Buscar efeito" }).fill("fissura");
    await picker.getByText("Fissura", { exact: true }).first().click();
    await picker.getByRole("button", { name: "Usar efeito" }).click();
    await expect(picker).toBeHidden();
    await expect(dialog.getByText("Fissura", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Salvar animações" }).click();
    await expect(dialog).toBeHidden();
    await expect
      .poll(
        async () =>
          (await payloadOf<StoredEffects>(await gm.get(`/characters/${playerCharacterId}`))).sheet
            .effects?.damage?.health,
      )
      .toBe("fissure");

    await page.goto("/mesa");
    await openArena(page);
    await page.getByRole("navigation", { name: "Meus tokens" }).getByRole("button").first().click();
    const tokenMenu = await openTokenMenu(page);
    await tokenMenu.getByRole("menuitem", { name: "Aplicar mudança" }).click();
    const menu = page.getByRole("dialog", { name: "Aplicar mudança" });
    await menu.getByText("Causar dano", { exact: true }).click();
    await expect(
      menu.getByRole("button", { name: "Efeito: Automático (Fissura). Trocar efeito" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });
});
