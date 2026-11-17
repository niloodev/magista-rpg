import { expect } from "@playwright/test";

import { GM, PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { loginAs, openSheet } from "../support/session";
import { readSheet, writeLists } from "../support/sheet";
import { test } from "../support/test";

const TRAIT = { id: "ping-trait", name: "Visão no escuro", description: "Enxerga no escuro." };
const ITEM = {
  id: "ping-item",
  name: "Escudo de carvalho",
  quantity: 1,
  armorBonus: 2,
  weightGrams: 1500,
  description: "Leve e resistente.",
};

test.describe("mostrar traços e itens na mesa", () => {
  let original: Awaited<ReturnType<typeof readSheet>>["sheet"] | null = null;

  test.beforeAll(async () => {
    const current = await readSheet();
    original = current.sheet;
    await writeLists({
      traits: [TRAIT],
      inventory: { maxWeightGrams: current.sheet.inventory.maxWeightGrams, items: [ITEM] },
    });
  });

  test.afterAll(async () => {
    if (original) await writeLists({ traits: original.traits, inventory: original.inventory });
  });

  test("o jogador mostra um traço e um item e a mesa vê o cartão na hora", async ({ browser }) => {
    const gm = await (await browser.newContext()).newPage();
    await loginAs(gm, GM);
    await expect(gm.getByText("Conectado")).toBeVisible();
    const player = await (await browser.newContext()).newPage();
    await loginAs(player, PLAYER);
    await openSheet(player, e2eState().playerCharacterId);

    await player.getByRole("tab", { name: "Traços" }).click();
    await player.getByRole("button", { name: `Mostrar ${TRAIT.name} na mesa` }).click();
    await expect(
      player.getByRole("button", { name: `${TRAIT.name} mostrado na mesa` }),
    ).toBeVisible();
    await expect(player.getByRole("button", { name: "Fechar (Esc)" })).toHaveCount(0);
    const traitCard = gm.locator("ol > li").first();
    await expect(traitCard).toContainText(TRAIT.name, { timeout: 2000 });
    await expect(traitCard).toContainText("Traço");
    await expect(traitCard).toContainText(TRAIT.description);

    await player.getByRole("tab", { name: "Inventário" }).click();
    await player.getByRole("button", { name: `Mostrar ${ITEM.name} na mesa` }).click();
    const itemCard = gm.locator("ol > li").first();
    await expect(itemCard).toContainText(ITEM.name, { timeout: 2000 });
    await expect(itemCard).toContainText("Qtd. 1 · 1,5 kg · CA +2");
    await expect(itemCard).toContainText(ITEM.description);
  });
});
