import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { settleAnimations } from "../support/animations";
import { apiAs, payloadOf } from "../support/api";
import { GM, PLAYER } from "../support/env";
import { loginAs } from "../support/session";

const SUFFIX = Date.now().toString(36);
const NAME = `E2E Imagens ${SUFFIX}`;
const fixture = (file: string) => fileURLToPath(new URL(`../fixtures/${file}`, import.meta.url));

interface CharacterImages {
  id: string;
  name: string;
  avatarUrl: string | null;
  artUrl: string | null;
}

async function characterNamed(name: string) {
  const gm = await apiAs(GM);
  const characters = await payloadOf<CharacterImages[]>(await gm.get("/characters"));
  await gm.dispose();
  return characters.find((character) => character.name === name);
}

async function axeViolations(page: Page) {
  await settleAnimations(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
}

const rowOf = (page: Page, name: string) =>
  page.locator("li", { has: page.getByRole("link", { name, exact: true }) }).last();

test.describe.configure({ mode: "serial" });

test.describe("imagens dos personagens (avatar e arte)", () => {
  test.afterAll(async () => {
    const gm = await apiAs(GM);
    const characters = await payloadOf<CharacterImages[]>(await gm.get("/characters"));
    for (const character of characters.filter((c) => c.name.startsWith("E2E Imagens ")))
      await gm.delete(`/characters/${character.id}`);
    await gm.dispose();
  });

  test("Mestre cria a ficha já com avatar e arte", async ({ page }) => {
    await loginAs(page, GM);
    await page.getByRole("button", { name: "Nova ficha", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Nova ficha" });
    await dialog.getByLabel("Nome do personagem").fill(NAME);
    const inputs = dialog.locator("input[type=file]");
    await inputs.nth(0).setInputFiles(fixture("avatar.png"));
    await inputs.nth(1).setInputFiles(fixture("art.png"));
    await expect(dialog.getByRole("img", { name: "Prévia: Avatar" })).toBeVisible();
    await expect(dialog.getByRole("img", { name: "Prévia: Arte" })).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
    await dialog.getByRole("button", { name: "Criar ficha" }).click();
    await expect(dialog).toBeHidden();

    await expect
      .poll(async () => {
        const created = await characterNamed(NAME);
        return [Boolean(created?.avatarUrl), Boolean(created?.artUrl)];
      })
      .toEqual([true, true]);
    const created = await characterNamed(NAME);
    expect(created?.avatarUrl).toMatch(/^\/media\/characters\/.+\/avatar-.+\.png$/);
    const media = await page.request.get(`http://localhost:3333${created?.artUrl}`);
    expect(media.headers()["content-type"]).toBe("image/png");
    await expect(rowOf(page, NAME).locator("img")).toHaveAttribute("src", /avatar-/);
  });

  test("a ficha mostra o avatar no retrato e a arte em Ver arte completa", async ({ page }) => {
    await loginAs(page, GM);
    const created = await characterNamed(NAME);
    await page.goto(`/ficha/${created?.id}`);
    await expect(page.locator("[data-skeleton-region]")).toHaveCount(0);
    await page.getByRole("button", { name: "Ver arte completa" }).click();
    await expect(page.getByRole("dialog").locator("img")).toHaveAttribute("src", /art-/);
  });

  test("Mestre troca e remove imagens pelo modal Imagens; arquivo falso é recusado", async ({
    page,
  }) => {
    await loginAs(page, GM);
    const before = await characterNamed(NAME);
    await page.getByRole("button", { name: `Ações de ${NAME}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Imagens" }).click();
    const dialog = page.getByRole("dialog", { name: "Imagens" });
    await expect(dialog.getByRole("img", { name: "Prévia: Avatar" })).toBeVisible();

    await dialog.locator("input[type=file]").nth(1).setInputFiles(fixture("not-an-image.png"));
    await expect(dialog.getByRole("alert")).toHaveText("Escolha uma imagem PNG, JPG, WEBP ou GIF.");

    await dialog.getByRole("button", { name: /^Remover\W*Arte$/ }).click();
    await expect(dialog.getByText("Será removida ao salvar.")).toBeVisible();
    await dialog.getByRole("button", { name: /^Desfazer\W*Arte$/ }).click();
    await dialog.getByRole("button", { name: /^Remover\W*Arte$/ }).click();
    await dialog.locator("input[type=file]").nth(0).setInputFiles(fixture("art.png"));
    expect(await axeViolations(page)).toEqual([]);
    await dialog.getByRole("button", { name: "Salvar imagens" }).click();
    await expect(dialog).toBeHidden();

    await expect.poll(async () => (await characterNamed(NAME))?.artUrl ?? null).toBeNull();
    const after = await characterNamed(NAME);
    expect(after?.avatarUrl).not.toBe(before?.avatarUrl);
    const old = await page.request.get(`http://localhost:3333${before?.avatarUrl}`);
    expect(old.status()).toBe(404);
  });

  test("jogador não vê nem consegue enviar imagens", async ({ page }) => {
    await loginAs(page, PLAYER);
    await expect(page.getByRole("button", { name: /^Ações de/ })).toHaveCount(0);
    const created = await characterNamed(NAME);
    const player = await apiAs(PLAYER);
    const response = await player.put(`/characters/${created?.id}/images/avatar`, {
      multipart: {
        file: { name: "a.png", mimeType: "image/png", buffer: Buffer.from("x") },
      },
    });
    expect(response.status()).toBe(403);
    await player.dispose();
  });
});
