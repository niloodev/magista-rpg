import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

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

const FIGURE = fileURLToPath(new URL("../fixtures/figure.png", import.meta.url));

const ROLLS_PANEL = 340;

const SIDEBAR = 360;

interface FigureToken {
  id: string;
  name: string;
  size: number;
  style: "portrait" | "figure";
  showName: boolean;
  imageUrl: string | null;
}

async function sceneTokens(gm: APIRequestContext, sceneId: string): Promise<FigureToken[]> {
  return (await readArena(gm, sceneId)).tokens as unknown as FigureToken[];
}

async function selectAll(page: Page): Promise<void> {
  await page.getByRole("application", { name: /Mapa da cena/ }).focus();
  await page.keyboard.press("Control+a");
}

/**
 * Drops an image file from "the computer" in the middle of the visible map (between the side panels).
 */
async function dropImageOnMap(page: Page, fileName: string): Promise<void> {
  const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
  const point = {
    x: ROLLS_PANEL + (viewport.width - ROLLS_PANEL - SIDEBAR) / 2,
    y: 56 + (viewport.height - 56) / 2,
  };
  const base64 = readFileSync(FIGURE).toString("base64");
  await page.evaluate(
    ({ base64, fileName, point }) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const transfer = new DataTransfer();
      transfer.items.add(new File([bytes], fileName, { type: "image/png" }));
      const target = document.querySelector("[role=application]")?.parentElement;
      for (const type of ["dragenter", "dragover", "drop"])
        target?.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer: transfer,
            clientX: point.x,
            clientY: point.y,
          }),
        );
    },
    { base64, fileName, point },
  );
}

test.describe.configure({ mode: "serial" });

test.describe("arena: token isométrico, menu do token, copiar e colar", () => {
  let gm: APIRequestContext;
  let previousLive: string | null = null;
  let sceneId = "";

  test.beforeAll(async () => {
    gm = await apiAs(GM);
    previousLive = (await readArena(gm)).activeSceneId;
    sceneId = (await createArenaScene(gm, "Figuras de teste", [{ name: "Lobo" }])).sceneId;
    await setLiveScene(gm, sceneId);
  });

  test.afterAll(async () => {
    await setLiveScene(gm, previousLive);
    await gm.delete(`/arena/scenes/${sceneId}`);
    await gm.dispose();
  });

  test("o Mestre renomeia o token avulso, troca a imagem, escolhe o formato e esconde o nome", async ({
    page,
  }) => {
    await loginAs(page, GM);
    await openArena(page);
    await selectAll(page);
    await (await openTokenMenu(page)).getByRole("menuitem", { name: "Configurar" }).click();
    const dialog = page.getByRole("dialog", { name: "Configurações do token" });
    await dialog.getByLabel("Nome", { exact: true }).fill("Lobo alfa");
    await dialog.locator("input[type=file]").setInputFiles(FIGURE);
    await dialog.getByText("Isométrico", { exact: true }).click();
    await dialog.getByRole("checkbox", { name: "Mostrar nome no mapa" }).uncheck();
    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(dialog).toBeHidden();
    await expect
      .poll(async () => {
        const [token] = await sceneTokens(gm, sceneId);
        return token && [token.name, token.style, token.showName, Boolean(token.imageUrl)];
      })
      .toEqual(["Lobo alfa", "figure", false, true]);
  });

  test("o jogador não lê o nome escondido do token", async ({ page }) => {
    await loginAs(page, PLAYER);
    await openArena(page);
    await selectAll(page);
    const menu = await openTokenMenu(page);
    await expect(menu).toHaveAccessibleName("Ações de Token");
    await expect(menu.getByRole("menuitem")).toHaveText(["Aplicar mudança"]);
  });

  test("o Mestre copia e cola tokens com Ctrl+C e Ctrl+V", async ({ page }) => {
    await loginAs(page, GM);
    await openArena(page);
    await selectAll(page);
    await page.keyboard.press("Control+c");
    await page.keyboard.press("Control+v");
    await expect.poll(async () => (await sceneTokens(gm, sceneId)).length).toBe(2);
    const [original, copy] = await sceneTokens(gm, sceneId);
    expect(copy?.id).not.toBe(original?.id);
    expect(copy).toMatchObject({
      name: original?.name,
      size: original?.size,
      style: original?.style,
      showName: original?.showName,
      imageUrl: original?.imageUrl,
    });
  });

  test("o Mestre cola os tokens copiados em outra cena", async ({ page }) => {
    const other = await createArenaScene(gm, "Figuras de destino", []);
    try {
      await loginAs(page, GM);
      await openArena(page);
      await selectAll(page);
      await page.keyboard.press("Control+c");
      await setLiveScene(gm, other.sceneId);
      await expect(
        page.getByRole("application", { name: /Mapa da cena Figuras de destino/ }),
      ).toBeVisible();
      await page.getByRole("application", { name: /Mapa da cena/ }).focus();
      await page.keyboard.press("Control+v");
      await expect.poll(async () => (await sceneTokens(gm, other.sceneId)).length).toBe(2);
      expect((await sceneTokens(gm, sceneId)).length).toBe(2);
    } finally {
      await setLiveScene(gm, sceneId);
      await gm.delete(`/arena/scenes/${other.sceneId}`);
    }
  });

  test("o Mestre solta uma imagem do computador no mapa e cria um token isométrico", async ({
    page,
  }) => {
    await loginAs(page, GM);
    await openArena(page);
    await dropImageOnMap(page, "ogro_da_caverna.png");
    const dialog = page.getByRole("dialog", { name: "Token da imagem" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Nome", { exact: true })).toHaveValue("ogro da caverna");
    await expect(dialog.getByRole("radio", { name: /Isométrico/ })).toBeChecked();
    await dialog.getByRole("button", { name: "Criar token" }).click();
    await expect(dialog).toBeHidden();
    await expect
      .poll(async () => {
        const token = (await sceneTokens(gm, sceneId)).find(
          (entry) => entry.name === "ogro da caverna",
        );
        return token && [token.style, Boolean(token.imageUrl)];
      })
      .toEqual(["figure", true]);
  });

  test("o Mestre escolhe o token isométrico e esconde o nome pelo modal Imagens da ficha", async ({
    page,
  }) => {
    const { otherCharacterId } = e2eState();
    const { name } = await payloadOf<{ name: string }>(
      await gm.get(`/characters/${otherCharacterId}`),
    );
    try {
      await loginAs(page, GM);
      await page.getByRole("button", { name: `Ações de ${name}`, exact: true }).click();
      await page.getByRole("menuitem", { name: "Imagens" }).click();
      const dialog = page.getByRole("dialog", { name: "Imagens" });
      await dialog.locator("input[type=file]").nth(2).setInputFiles(FIGURE);
      await dialog.getByText("Isométrico", { exact: true }).click();
      await dialog.getByRole("checkbox", { name: "Mostrar nome do token no mapa" }).uncheck();
      await dialog.getByRole("button", { name: "Salvar imagens" }).click();
      await expect(dialog).toBeHidden();
      await expect
        .poll(async () => {
          const character = await payloadOf<{
            figureUrl: string | null;
            tokenStyle: string;
            showTokenName: boolean;
          }>(await gm.get(`/characters/${otherCharacterId}`));
          return [Boolean(character.figureUrl), character.tokenStyle, character.showTokenName];
        })
        .toEqual([true, "figure", false]);
      const placed = await payloadOf<{ token: FigureToken }>(
        await gm.post(`/arena/scenes/${sceneId}/tokens`, {
          data: { characterId: otherCharacterId },
        }),
      );
      expect(placed.token).toMatchObject({ style: "figure", showName: false });
    } finally {
      await gm.put(`/characters/${otherCharacterId}/token`, {
        data: { style: "portrait", showName: true },
      });
      await gm.delete(`/characters/${otherCharacterId}/images/figure`);
    }
  });
});
