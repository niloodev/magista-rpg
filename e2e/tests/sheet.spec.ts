import { expect, test } from "@playwright/test";

import { apiAs, payloadOf } from "../support/api";
import { GM, PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { loginAs, openSheet } from "../support/session";

test.describe("ficha", () => {
  test("o Mestre vê todas as fichas e o jogador só as liberadas para ele", async ({ browser }) => {
    const gm = await (await browser.newContext()).newPage();
    await loginAs(gm, GM);
    await expect(gm.locator("a[href^='/ficha/']").first()).toBeVisible();
    expect(await gm.locator("a[href^='/ficha/']").count()).toBeGreaterThan(1);
    const player = await (await browser.newContext()).newPage();
    await loginAs(player, PLAYER);
    await expect(player.locator("a[href^='/ficha/']").first()).toBeVisible();
    expect(await player.locator("a[href^='/ficha/']").count()).toBeLessThan(
      await gm.locator("a[href^='/ficha/']").count(),
    );
  });

  test("atributo recalcula modificador, CD e perícias e salva sozinho", async ({ page }) => {
    const { playerCharacterId } = e2eState();
    await loginAs(page, PLAYER);
    await openSheet(page, playerCharacterId);
    const forca = page.getByRole("group", { name: "Força" });
    await forca.getByRole("textbox", { name: "Valor de Força" }).fill("16");
    await expect(forca.getByRole("button", { name: /Rolar teste de Força/ })).toContainText("+3");
    await expect(page.getByText("Salvo")).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("group", { name: "Força" }).getByRole("textbox", { name: "Valor de Força" }),
    ).toHaveValue("16");
  });

  test("jogador não abre a ficha de outro personagem", async ({ page }) => {
    const { otherCharacterId } = e2eState();
    await loginAs(page, PLAYER);
    await page.goto(`/ficha/${otherCharacterId}`);
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(
      "Você não tem acesso a esta ficha.",
    );
  });

  test("edição do Mestre chega ao vivo na tela do jogador", async ({ browser }) => {
    const { playerCharacterId } = e2eState();
    const player = await (await browser.newContext()).newPage();
    await loginAs(player, PLAYER);
    await openSheet(player, playerCharacterId);
    const gm = await (await browser.newContext()).newPage();
    await loginAs(gm, GM);
    await openSheet(gm, playerCharacterId);
    await gm.getByRole("button", { name: "Editar identidade" }).click();
    await gm.locator("dialog[open] input[id$='-variant']").fill("Variação ao vivo");
    await gm.locator("dialog[open] button[type=submit]").click();
    await expect(player.locator("dt:text-is('Variação') + dd")).toHaveText("Variação ao vivo");
  });
  test("salvamento com versão de base antiga é recusado com 409, mesmo mexendo em campo do Mestre", async () => {
    const { playerCharacterId } = e2eState();
    const api = await apiAs(PLAYER);
    const url = `/characters/${playerCharacterId}`;
    const current = await payloadOf<{
      sheet: { identity: Record<string, unknown> };
      updatedAt: string;
    }>(await api.get(url));
    const first = await api.put(`${url}/sheet`, {
      data: { sheet: current.sheet, baseUpdatedAt: current.updatedAt },
    });
    expect(first.status()).toBe(200);
    const repeated = await api.put(`${url}/sheet`, {
      data: { sheet: current.sheet, baseUpdatedAt: current.updatedAt },
    });
    expect(repeated.status()).toBe(409);
    const staleGmChange = await api.put(`${url}/sheet`, {
      data: {
        sheet: { ...current.sheet, identity: { ...current.sheet.identity, level: 50 } },
        baseUpdatedAt: current.updatedAt,
      },
    });
    expect(staleGmChange.status()).toBe(409);
    await api.dispose();
  });
});
