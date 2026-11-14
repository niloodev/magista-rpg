import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { settleAnimations } from "../support/animations";
import { PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { loginAs, openSheet } from "../support/session";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"];

async function violations(page: Page) {
  await settleAnimations(page);
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations.map(
    (violation) => `${violation.id}: ${violation.nodes[0]?.target.join(" ")}`,
  );
}

test.describe("acessibilidade (axe, WCAG 2.1 AA)", () => {
  test("login", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    expect(await violations(page)).toEqual([]);
  });

  test("todas as abas da ficha e um modal aberto", async ({ page }) => {
    await loginAs(page, PLAYER);
    await openSheet(page, e2eState().playerCharacterId);
    for (const tab of ["geral", "habilidades", "inventario", "tracos"]) {
      await page.locator(`#sheet-tab-${tab}`).click();
      expect(await violations(page), `aba ${tab}`).toEqual([]);
    }
    await page.getByRole("button", { name: "Editar identidade" }).click();
    expect(await violations(page), "modal").toEqual([]);
  });

  test("abas navegáveis pelo teclado", async ({ page }) => {
    await loginAs(page, PLAYER);
    await openSheet(page, e2eState().playerCharacterId);
    await page.locator("#sheet-tab-geral").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#sheet-tab-habilidades")).toBeFocused();
    await expect(page.locator("#sheet-tab-habilidades")).toHaveAttribute("aria-selected", "true");
  });
});
