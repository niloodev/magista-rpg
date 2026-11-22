import { readFileSync } from "node:fs";

import { expect, type APIRequestContext, type Page } from "@playwright/test";

import { payloadOf } from "./api";

export interface ArenaToken {
  id: string;
  characterId: string | null;
  name: string;
  x: number;
  y: number;
  size: number;
  hidden: boolean;
}

interface ArenaView {
  activeSceneId: string | null;
  scene: { id: string; name: string; width: number; height: number } | null;
  tokens: ArenaToken[];
}

const MAP_FIXTURE = new URL("../fixtures/map.png", import.meta.url);

/**
 * Creates a scene with a map and puts tokens on it through the GM API.
 */
export async function createArenaScene(
  gm: APIRequestContext,
  name: string,
  tokens: Record<string, unknown>[],
): Promise<{ sceneId: string; tokens: ArenaToken[] }> {
  const scene = await payloadOf<{ id: string }>(await gm.post("/arena/scenes", { data: { name } }));
  await payloadOf(
    await gm.put(`/arena/scenes/${scene.id}/map`, {
      multipart: {
        file: { name: "map.png", mimeType: "image/png", buffer: readFileSync(MAP_FIXTURE) },
      },
    }),
  );
  const created: ArenaToken[] = [];
  for (const token of tokens) {
    const change = await payloadOf<{ token: ArenaToken }>(
      await gm.post(`/arena/scenes/${scene.id}/tokens`, { data: token }),
    );
    created.push(change.token);
  }
  return { sceneId: scene.id, tokens: created };
}

/**
 * What the given account sees in the Arena right now.
 */
export async function readArena(api: APIRequestContext, sceneId?: string): Promise<ArenaView> {
  return payloadOf<ArenaView>(await api.get(`/arena${sceneId ? `?sceneId=${sceneId}` : ""}`));
}

/**
 * Puts a scene live (or none).
 */
export async function setLiveScene(gm: APIRequestContext, sceneId: string | null): Promise<void> {
  await payloadOf(await gm.put("/arena/active", { data: { sceneId } }));
}

/**
 * Opens the Arena from the table and waits for the board to finish loading.
 */
export async function openArena(page: Page): Promise<void> {
  await page.getByRole("link", { name: "Arena" }).click();
  await page.waitForURL("**/arena");
  await expect(page.getByText("Mesa conectada")).toBeVisible();
  await expect(page.locator("[data-skeleton-region]")).toHaveCount(0, { timeout: 20_000 });
  await expect(
    page.getByRole("progressbar", { name: "Carregando os recursos da Arena" }),
  ).toHaveCount(0, { timeout: 40_000 });
}

/**
 * Opens the right-click menu of the current selection from the keyboard (Shift+F10 on the map).
 */
export async function openTokenMenu(page: Page) {
  await page.getByRole("application", { name: /Mapa da cena/ }).focus();
  await page.keyboard.press("Shift+F10");
  const menu = page.getByRole("menu", { name: /^Ações de/ });
  await expect(menu).toBeVisible();
  return menu;
}
