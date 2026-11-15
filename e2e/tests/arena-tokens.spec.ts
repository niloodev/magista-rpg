import { expect, test, type APIRequestContext } from "@playwright/test";

import { apiAs, payloadOf } from "../support/api";
import { createArenaScene, openArena, readArena, setLiveScene } from "../support/arena";
import { dragTo } from "../support/drag";
import { GM, PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { loginAs } from "../support/session";

const SCENE = "Campo de tokens";
const NPC = "Lobo de teste";

test.describe("arena: Mestre cria tokens", () => {
  let gm: APIRequestContext;
  let previousLive: string | null = null;
  let sceneId = "";
  let characterName = "";

  test.beforeAll(async () => {
    gm = await apiAs(GM);
    previousLive = (await readArena(gm)).activeSceneId;
    sceneId = (await createArenaScene(gm, SCENE, [])).sceneId;
    await setLiveScene(gm, sceneId);
    const character = await payloadOf<{ name: string }>(
      await gm.get(`/characters/${e2eState().playerCharacterId}`),
    );
    characterName = character.name;
  });

  test.afterAll(async () => {
    await setLiveScene(gm, previousLive);
    await gm.delete(`/arena/scenes/${sceneId}`);
    await gm.dispose();
  });

  test("arrastar a ficha para o mapa, colocar pelo menu e criar token avulso", async ({ page }) => {
    const { playerCharacterId } = e2eState();
    await loginAs(page, GM);
    await openArena(page);
    const sidebar = page.getByRole("complementary", { name: "Barra lateral da Arena" });
    const row = sidebar.getByRole("button", { name: characterName, exact: true });
    await expect(row).toBeVisible();

    await dragTo(page, row, sidebar.getByRole("tab", { name: "Fichas" }));
    await dragTo(page, row, page.getByRole("button", { name: "Aproximar" }));
    await page.waitForTimeout(500);
    expect((await readArena(gm, sceneId)).tokens).toHaveLength(0);

    const rowBox = await row.boundingBox();
    const mapBox = await page.getByRole("application").boundingBox();
    if (!rowBox || !mapBox) throw new Error("Ficha ou mapa fora da tela");
    await page.mouse.move(rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height / 2 + 12, {
      steps: 4,
    });
    await page.mouse.move(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2, { steps: 20 });
    await page.mouse.up();
    await expect
      .poll(
        async () =>
          (await readArena(gm, sceneId)).tokens.filter(
            (token) => token.characterId === playerCharacterId,
          ).length,
      )
      .toBe(1);

    await sidebar.getByRole("button", { name: `Ações de ${characterName}` }).click();
    await page.getByRole("menuitem", { name: "Colocar no mapa" }).click();
    await expect
      .poll(
        async () =>
          (await readArena(gm, sceneId)).tokens.filter(
            (token) => token.characterId === playerCharacterId,
          ).length,
      )
      .toBe(2);
    await expect(page.getByText("1 token selecionado")).toBeVisible();

    await sidebar.getByRole("button", { name: "Token avulso" }).click();
    const dialog = page.getByRole("dialog", { name: "Token avulso" });
    await dialog.getByLabel("Nome").fill(NPC);
    await dialog.getByRole("button", { name: "Criar token" }).click();
    await expect(dialog).toBeHidden();
    await expect
      .poll(async () => (await readArena(gm, sceneId)).tokens.some((token) => token.name === NPC))
      .toBe(true);
  });

  test("o jogador não vê as ferramentas de criar tokens", async ({ page }) => {
    await loginAs(page, PLAYER);
    await openArena(page);
    const sidebar = page.getByRole("complementary", { name: "Barra lateral da Arena" });
    await expect(sidebar.getByRole("tab", { name: "Fichas" })).toBeVisible();
    await expect(sidebar.getByRole("button", { name: "Token avulso" })).toHaveCount(0);
    await expect(sidebar.getByRole("button", { name: /^Ações de / })).toHaveCount(0);
  });
});
