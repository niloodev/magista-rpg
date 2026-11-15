import { readFileSync } from "node:fs";

import { expect, test, type APIRequestContext } from "@playwright/test";

import { apiAs, payloadOf } from "../support/api";
import { openArena, readArena, setLiveScene } from "../support/arena";
import { GM, PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { loginAs, openSheet } from "../support/session";

const SCENE = "Cripta de teste";
const FOLDER = "Arco de teste";
const MAP = readFileSync(new URL("../fixtures/map.png", import.meta.url));

interface Library {
  scenes: { id: string; name: string; folderId: string | null }[];
  folders: { id: string; name: string }[];
}

test.describe("arena: ferramentas do Mestre", () => {
  let gm: APIRequestContext;
  let previousLive: string | null = null;

  test.beforeAll(async () => {
    gm = await apiAs(GM);
    previousLive = (await readArena(gm)).activeSceneId;
  });

  test.afterAll(async () => {
    await setLiveScene(gm, previousLive);
    const library = await payloadOf<Library>(await gm.get("/arena/library"));
    for (const scene of library.scenes.filter((entry) => entry.name === SCENE))
      await gm.delete(`/arena/scenes/${scene.id}`);
    for (const folder of library.folders.filter((entry) => entry.name === FOLDER))
      await gm.delete(`/arena/folders/${folder.id}`);
    await gm.dispose();
  });

  test("o Mestre cria cena e pasta, vê em prévia e coloca no ar para o jogador", async ({
    browser,
  }) => {
    const gmPage = await (await browser.newContext()).newPage();
    await loginAs(gmPage, GM);
    await openArena(gmPage);
    await gmPage.getByRole("tab", { name: "Mapas" }).click();

    await gmPage.getByRole("button", { name: "Nova pasta" }).click();
    const folderDialog = gmPage.getByRole("dialog", { name: "Nova pasta" });
    await folderDialog.getByLabel("Nome da pasta").fill(FOLDER);
    await folderDialog.getByRole("button", { name: "Criar" }).click();
    await expect(gmPage.getByText(FOLDER)).toBeVisible();

    await gmPage.getByRole("button", { name: `Ações da pasta ${FOLDER}` }).click();
    await gmPage.getByRole("menuitem", { name: "Nova cena aqui" }).click();
    const sceneDialog = gmPage.getByRole("dialog", { name: "Nova cena" });
    await sceneDialog.getByLabel("Nome da cena").fill(SCENE);
    await sceneDialog.locator('input[type="file"]').setInputFiles({
      name: "map.png",
      mimeType: "image/png",
      buffer: MAP,
    });
    await sceneDialog.getByRole("button", { name: "Criar" }).click();

    await expect(gmPage.getByRole("heading", { level: 1, name: SCENE })).toBeVisible();
    await expect(gmPage.getByText("Prévia")).toBeVisible();
    const library = await payloadOf<Library>(await gm.get("/arena/library"));
    const created = library.scenes.find((scene) => scene.name === SCENE);
    const folder = library.folders.find((entry) => entry.name === FOLDER);
    expect(created?.folderId).toBe(folder?.id);
    expect((await readArena(gm)).activeSceneId).not.toBe(created?.id);

    const playerPage = await (await browser.newContext()).newPage();
    await loginAs(playerPage, PLAYER);
    await openArena(playerPage);
    await expect(playerPage.getByRole("heading", { level: 1, name: SCENE })).toHaveCount(0);

    await gmPage.getByRole("button", { name: "Colocar no ar" }).click();
    await expect(gmPage.getByText("Ao vivo").first()).toBeVisible();
    await expect(playerPage.getByRole("heading", { level: 1, name: SCENE })).toBeVisible();
  });

  test("o Mestre tira a cena da pasta arrastando para a raiz", async ({ page }) => {
    await loginAs(page, GM);
    await openArena(page);
    await page.getByRole("tab", { name: "Mapas" }).click();
    const folderToggle = page.locator("button[aria-expanded]").filter({ hasText: FOLDER });
    if ((await folderToggle.getAttribute("aria-expanded")) === "false") await folderToggle.click();
    const handle = page.getByRole("button", { name: `Mover cena ${SCENE}` });
    await expect(handle).toBeVisible();
    const from = await handle.boundingBox();
    const root = await page.getByTestId("library-root-drop").boundingBox();
    if (!from || !root) throw new Error("Alça ou raiz fora da tela");
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(root.x + root.width / 2, root.y + root.height / 2 + 8, { steps: 8 });
    await page.mouse.move(root.x + root.width / 2, root.y + root.height / 2, { steps: 4 });
    await page.mouse.up();
    await expect
      .poll(async () => {
        const library = await payloadOf<Library>(await gm.get("/arena/library"));
        return library.scenes.find((scene) => scene.name === SCENE)?.folderId;
      })
      .toBeNull();
  });

  test("o jogador vê só as próprias fichas na barra e não a aba Mapas", async ({ page }) => {
    await loginAs(page, PLAYER);
    await openArena(page);
    await expect(page.getByRole("tab", { name: "Fichas" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Mapas" })).toHaveCount(0);
    await page.getByRole("button", { name: "Recolher barra lateral" }).click();
    await expect(page.getByRole("tab", { name: "Fichas" })).toHaveCount(0);
    await page.getByRole("button", { name: "Abrir barra lateral" }).click();
    await expect(page.getByRole("tab", { name: "Fichas" })).toBeVisible();
    await page.getByRole("button", { name: "Recolher rolagens" }).click();
    await expect(page.getByRole("complementary", { name: "Rolagens da mesa" })).toHaveCount(0);
    await page.getByRole("button", { name: "Abrir rolagens" }).click();
    await expect(page.getByRole("complementary", { name: "Rolagens da mesa" })).toBeVisible();
  });

  test("a largura das barras é ajustável pelo teclado e fica salva", async ({ page }) => {
    await loginAs(page, PLAYER);
    await openArena(page);
    const handle = page.getByRole("separator", { name: "Largura da barra lateral" });
    await handle.focus();
    await page.keyboard.press("End");
    await expect(handle).toHaveAttribute("aria-valuenow", "560");
    await page.reload();
    await expect(page.getByRole("separator", { name: "Largura da barra lateral" })).toHaveAttribute(
      "aria-valuenow",
      "560",
    );
    await page.getByRole("separator", { name: "Largura da barra lateral" }).focus();
    await page.keyboard.press("Home");
    await expect(page.getByRole("separator", { name: "Largura da barra lateral" })).toHaveAttribute(
      "aria-valuenow",
      "300",
    );
  });

  test("na Arena a mesa vê a rolagem em suspense antes do resultado", async ({ browser }) => {
    const gmPage = await (await browser.newContext()).newPage();
    await loginAs(gmPage, GM);
    await openArena(gmPage);
    const feed = gmPage.getByRole("complementary", { name: "Rolagens da mesa" });
    const player = await (await browser.newContext()).newPage();
    await loginAs(player, PLAYER);
    await openSheet(player, e2eState().playerCharacterId);
    await player.getByRole("button", { name: /Rolar teste de Força/ }).click();
    const pending = feed.locator("li").filter({ hasText: "rolando os dados..." });
    await expect(pending).toBeVisible({ timeout: 3000 });
    await expect(pending).toContainText("Teste de Força");
    await expect(pending).toHaveCount(0, { timeout: 8000 });
    await expect(feed.locator("ol > li").first()).toContainText("Teste de Força");
  });
});
