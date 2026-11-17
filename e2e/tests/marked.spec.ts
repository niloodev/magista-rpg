import { expect, type Locator, type Page } from "@playwright/test";

import { apiAs, payloadOf } from "../support/api";
import { GM, PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { loginAs, openSheet } from "../support/session";
import { readSheet, writeLists } from "../support/sheet";
import { test } from "../support/test";

const TRAIT = { id: "marked-trait", name: "Olhar da Marca", description: "Vê o que a Marca vê." };
const NPC = `Marcado E2E ${Date.now()}`;

async function setFeatures(characterId: string, features: string[]) {
  const gm = await apiAs(GM);
  const response = await gm.put(`/characters/${characterId}/features`, { data: { features } });
  if (!response.ok()) throw new Error(`Falha ao marcar a ficha: ${await response.text()}`);
  await gm.dispose();
}

/**
 * The GM answers for every pending Marcado (NPCs and real sheets alike; the share never edits a sheet).
 */
async function acceptAll(call: Locator) {
  const accept = call.getByRole("button", { name: /^Aceitar por / });
  while ((await accept.count()) > 0) {
    const before = await accept.count();
    await accept.first().click();
    await expect(accept).toHaveCount(before - 1);
  }
}

async function share(player: Page) {
  await player.getByRole("button", { name: "Compartilhar traço" }).click();
  const dialog = player.getByRole("dialog", { name: "Compartilhar pela Marca" });
  await expect(dialog.getByRole("radio", { name: TRAIT.name })).toBeChecked();
  await dialog.getByRole("button", { name: "Enviar à Marca" }).click();
}

test.describe("tag Marcado", () => {
  let npcId = "";
  let originalTraits: Awaited<ReturnType<typeof readSheet>>["sheet"]["traits"] = [];

  test.beforeAll(async () => {
    originalTraits = (await readSheet()).sheet.traits;
    await writeLists({ traits: [TRAIT] });
    const gm = await apiAs(GM);
    npcId = (await payloadOf<{ id: string }>(await gm.post("/characters", { data: { name: NPC } })))
      .id;
    await gm.dispose();
    await setFeatures(npcId, ["marked"]);
  });

  test.afterAll(async () => {
    const gm = await apiAs(GM);
    if (npcId) await gm.delete(`/characters/${npcId}`);
    await gm.dispose();
    await setFeatures(e2eState().playerCharacterId, []);
    await writeLists({ traits: originalTraits });
  });

  test("o Mestre aplica a tag pela biblioteca e a ficha ganha a Marca e o +2", async ({
    browser,
  }) => {
    const gm = await (await browser.newContext()).newPage();
    await loginAs(gm, GM);
    await gm.getByRole("searchbox", { name: "Buscar ficha pelo nome" }).fill(PLAYER.login);
    await gm.getByRole("button", { name: new RegExp(`^Ações de ${PLAYER.login}$`, "i") }).click();
    await gm.getByRole("menuitem", { name: "Tags especiais" }).click();
    const dialog = gm.getByRole("dialog", { name: /^Tags especiais de/ });
    await dialog.getByRole("checkbox", { name: "Marcado" }).check();
    await dialog.getByRole("button", { name: "Salvar tags" }).click();
    await expect(dialog).toHaveCount(0);

    const player = await (await browser.newContext()).newPage();
    await loginAs(player, PLAYER);
    await openSheet(player, e2eState().playerCharacterId);
    await expect(player.getByRole("list", { name: "Tags especiais" })).toContainText("Marcado");
    await expect(player.getByText("Valores já somam +2 da Marca.")).toBeVisible();
    await player.getByRole("tab", { name: "Traços" }).click();
    await expect(player.getByRole("heading", { name: "Alma de Marcado" })).toBeVisible();
  });

  test("um Marcado recusa e a Marca falha; todos aceitam e o traço aparece até ser encerrado", async ({
    browser,
  }) => {
    await setFeatures(e2eState().playerCharacterId, ["marked"]);
    const gm = await (await browser.newContext()).newPage();
    await loginAs(gm, GM);
    await expect(gm.getByText("Conectado")).toBeVisible();
    const player = await (await browser.newContext()).newPage();
    await loginAs(player, PLAYER);
    await openSheet(player, e2eState().playerCharacterId);
    await player.getByRole("tab", { name: "Traços" }).click();

    await share(player);
    const call = gm.getByRole("dialog", { name: "Chamado da Marca" });
    await expect(call).toContainText(TRAIT.name);
    await call.getByRole("button", { name: `Recusar por ${NPC}` }).click();
    await expect(player.getByRole("dialog", { name: "A Marca recusou" })).toContainText(
      `${NPC} recusou o compartilhamento.`,
    );
    await player.getByRole("button", { name: "Fechar", exact: true }).last().click();
    await gm.getByRole("button", { name: "Fechar", exact: true }).last().click();

    await share(player);
    const call2 = gm.getByRole("dialog", { name: "Chamado da Marca" });
    await expect(call2.getByRole("button", { name: `Aceitar por ${NPC}` })).toBeVisible();
    await acceptAll(call2);
    await expect(player.getByRole("dialog", { name: "A Marca se uniu" })).toBeVisible();
    await player.getByRole("button", { name: "Fechar", exact: true }).last().click();
    const shared = player.getByRole("article", {
      name: `${TRAIT.name}, traço compartilhado pela Marca`,
    });
    await expect(shared).toContainText(`compartilhado por ${PLAYER.login}`, {
      ignoreCase: true,
    });
    await expect(player.getByRole("button", { name: "Compartilhar traço" })).toBeDisabled();

    await shared.getByRole("button", { name: /^Encerrar compartilhamento/ }).click();
    await player
      .getByRole("dialog", { name: "Encerrar o traço da Marca?" })
      .getByRole("button", { name: "Encerrar" })
      .click();
    await expect(shared).toHaveCount(0);
    await expect(player.getByText("Nenhum traço compartilhado pela Marca agora.")).toBeVisible();
  });
});
