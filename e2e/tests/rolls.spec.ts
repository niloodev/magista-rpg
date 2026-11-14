import { expect, test, type BrowserContext } from "@playwright/test";

import { GM, PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { dismissRoll, loginAs, openSheet } from "../support/session";

async function forceNaturalTwenty(context: BrowserContext): Promise<void> {
  await context.routeWebSocket(/socket\.io/, (ws) => {
    const server = ws.connectToServer();
    server.onMessage((message) => {
      const head = typeof message === "string" ? /^(4[23]\d*)/.exec(message)?.[1] : undefined;
      if (typeof message !== "string" || !head || !message.includes('"sides":20')) {
        ws.send(message);
        return;
      }
      const data = JSON.parse(message.slice(head.length));
      const roll = data[0]?.payload ?? data[1];
      const row = roll?.rows?.[0];
      const d20 = row?.outcome.terms.find(
        (term: { kind: string; sides?: number; count?: number }) =>
          term.kind === "dice" && term.sides === 20 && term.count === 1,
      );
      if (d20) {
        row.outcome.total += 20 - d20.results[0];
        d20.results[0] = 20;
      }
      ws.send(head + JSON.stringify(data));
    });
  });
}

test.describe("rolagens", () => {
  test("quem rola vê a animação e a mesa só recebe depois", async ({ browser }) => {
    const ROLL_FEED_LIMIT = 50;
    const { playerCharacterId } = e2eState();
    const gm = await (await browser.newContext()).newPage();
    await loginAs(gm, GM);
    await expect(gm.getByText("Conectado")).toBeVisible();
    await gm.waitForTimeout(500);
    const before = await gm.locator("ol > li").count();
    const player = await (await browser.newContext()).newPage();
    await loginAs(player, PLAYER);
    await openSheet(player, playerCharacterId);
    await player.getByRole("button", { name: /Rolar teste de Força/ }).click();
    await expect(player.getByText(/Teste de Força/).first()).toBeVisible();
    await expect(gm.locator("ol > li")).toHaveCount(before);
    await expect(player.getByText(/^(Rolagem final|Crítico!)$/)).toBeVisible({ timeout: 8000 });
    await expect(gm.locator("ol > li")).toHaveCount(Math.min(before + 1, ROLL_FEED_LIMIT), {
      timeout: 8000,
    });
    await expect(gm.locator("ol > li").first()).toContainText("Teste de Força");
    await dismissRoll(player);
  });

  test("histórico volta depois de recarregar", async ({ page }) => {
    await loginAs(page, GM);
    await page.reload();
    await expect(page.getByText("Conectado")).toBeVisible();
    expect(await page.locator("ol > li").count()).toBeGreaterThan(0);
  });

  test("20 natural ganha a animação e o cartão dourados, sem efeitos de luz", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    await forceNaturalTwenty(context);
    const page = await context.newPage();
    await loginAs(page, PLAYER);
    await openSheet(page, e2eState().playerCharacterId);
    await page.getByRole("button", { name: /Rolar teste de Destreza/ }).click();
    await expect(page.getByText("Crítico!", { exact: true })).toBeVisible({ timeout: 8000 });
    const lighting =
      "[class*='rays-spin'], .magista-spark, [class*='gold-shimmer'], [class*='gold-sweep']";
    await expect(page.locator(lighting)).toHaveCount(0);
    await expect(page.getByTestId("critical-label")).toHaveCSS("color", "rgb(253, 230, 138)");
    await dismissRoll(page);
    const card = page.locator("aside ol > li").first();
    await expect(card).toContainText("Crítico", { timeout: 8000 });
    await expect(card.locator(lighting)).toHaveCount(0);
  });
});
