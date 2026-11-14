import { expect, test, type Page } from "@playwright/test";

import { apiAs, payloadOf } from "../support/api";
import { dragTo, pressKeys } from "../support/drag";
import { GM, PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { loginAs, openSheet } from "../support/session";

interface StoredSheet {
  sheet: Record<string, unknown> & {
    traits: { id: string; name: string }[];
    abilities: { id: string; name: string }[];
    innerRealm: { id: string; name: string }[];
    inventory: { maxWeightGrams: number | null; items: { id: string; name: string }[] };
  };
  updatedAt: string;
}

const ability = (id: string, name: string) => ({
  id,
  name,
  attackAttribute: null,
  damageDice: "",
  damageFlat: 0,
  damageAttribute: null,
  addBaseDamage: false,
  addProficiency: false,
  description: "",
});

async function readSheet(): Promise<StoredSheet> {
  const gm = await apiAs(GM);
  const result = await payloadOf<StoredSheet>(
    await gm.get(`/characters/${e2eState().playerCharacterId}`),
  );
  await gm.dispose();
  return result;
}

async function writeLists(lists: Partial<StoredSheet["sheet"]>) {
  const gm = await apiAs(GM);
  const current = await payloadOf<StoredSheet>(
    await gm.get(`/characters/${e2eState().playerCharacterId}`),
  );
  const response = await gm.put(`/characters/${e2eState().playerCharacterId}/sheet`, {
    data: { sheet: { ...current.sheet, ...lists }, baseUpdatedAt: current.updatedAt },
  });
  if (!response.ok()) throw new Error(`Falha ao preparar a ficha: ${await response.text()}`);
  await gm.dispose();
}

const names = (list: { name: string }[]) => list.map((entry) => entry.name);

const entry = (page: Page, list: string, name: string) =>
  page.getByRole("list", { name: list }).locator("li", { hasText: name });

test.describe("reordenar listas da ficha com arrastar e soltar", () => {
  test.beforeAll(async () => {
    const current = await readSheet();
    await writeLists({
      traits: ["A", "B", "C"].map((letter) => ({
        id: `trait-${letter}`,
        name: `Traço ${letter}`,
        description: "",
      })),
      abilities: ["A", "B"].map((letter) => ability(`ability-${letter}`, `Golpe ${letter}`)),
      innerRealm: ["A", "B"].map((letter) => ability(`realm-${letter}`, `Reino ${letter}`)),
      inventory: {
        maxWeightGrams: current.sheet.inventory.maxWeightGrams,
        items: ["A", "B", "C"].map((letter) => ({
          id: `item-${letter}`,
          name: `Item ${letter}`,
          quantity: 1,
          armorBonus: 0,
          weightGrams: 100,
          description: "",
        })),
      },
    });
  });

  test.afterAll(async () => {
    await writeLists({
      traits: [],
      abilities: [],
      innerRealm: [],
      inventory: { maxWeightGrams: 5000, items: [] },
    });
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, PLAYER);
    await openSheet(page, e2eState().playerCharacterId);
  });

  test("traços: teclado pela alça reordena e salva sozinho", async ({ page }) => {
    await page.locator("#sheet-tab-tracos").click();
    const handle = page.getByRole("button", { name: "Reordenar Traço A" });
    await handle.focus();
    await pressKeys(page, ["Space", "ArrowDown", "ArrowDown", "Space"]);
    await expect(page.getByRole("list", { name: "Traços" }).getByRole("heading")).toHaveText([
      "Traço B",
      "Traço C",
      "Traço A",
    ]);
    await expect(page.getByText("Salvo")).toBeVisible();
    await expect
      .poll(async () => names((await readSheet()).sheet.traits))
      .toEqual(["Traço B", "Traço C", "Traço A"]);
    await page.reload();
    await page.locator("#sheet-tab-tracos").click();
    await expect(
      page.getByRole("list", { name: "Traços" }).getByRole("heading").first(),
    ).toHaveText("Traço B");
  });

  test("inventário: arrastar com o mouse pela alça", async ({ page }) => {
    await page.locator("#sheet-tab-inventario").click();
    await dragTo(
      page,
      page.getByRole("button", { name: "Reordenar Item C" }),
      entry(page, "Itens do inventário", "Item A"),
      0.2,
    );
    await expect
      .poll(async () => names((await readSheet()).sheet.inventory.items))
      .toEqual(["Item C", "Item A", "Item B"]);
  });

  test("habilidades e Reino Interior reordenam cada um na sua lista", async ({ page }) => {
    await page.locator("#sheet-tab-habilidades").click();
    const handle = page.getByRole("button", { name: "Reordenar Golpe B" });
    await handle.focus();
    await pressKeys(page, ["Space", "ArrowUp", "Space"]);
    await dragTo(
      page,
      page.getByRole("button", { name: "Reordenar Reino B" }),
      entry(page, "Reino Interior", "Reino A"),
      0.2,
    );
    await expect
      .poll(async () => {
        const { sheet } = await readSheet();
        return [names(sheet.abilities), names(sheet.innerRealm)];
      })
      .toEqual([
        ["Golpe B", "Golpe A"],
        ["Reino B", "Reino A"],
      ]);
  });

  test("Esc cancela o arraste pelo teclado sem mudar a ordem", async ({ page }) => {
    await page.locator("#sheet-tab-inventario").click();
    const before = names((await readSheet()).sheet.inventory.items);
    await page.getByRole("button", { name: `Reordenar ${before[0]}` }).focus();
    await pressKeys(page, ["Space", "ArrowDown", "Escape"]);
    await page.waitForTimeout(600);
    expect(names((await readSheet()).sheet.inventory.items)).toEqual(before);
  });
});
