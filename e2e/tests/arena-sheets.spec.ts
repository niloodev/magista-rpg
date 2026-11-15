import { expect, test } from "@playwright/test";

import { apiAs, payloadOf } from "../support/api";
import { openArena } from "../support/arena";
import { GM, PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { loginAs } from "../support/session";
import { readSheet } from "../support/sheet";

async function characterName(id: string): Promise<string> {
  const gm = await apiAs(GM);
  const character = await payloadOf<{ name: string }>(await gm.get(`/characters/${id}`));
  await gm.dispose();
  return character.name;
}

test.describe("arena: fichas em janelas flutuantes", () => {
  test("o jogador abre a ficha numa janela sobre a Arena, edita e rola", async ({ page }) => {
    const { playerCharacterId } = e2eState();
    const name = await characterName(playerCharacterId);
    await loginAs(page, PLAYER);
    await openArena(page);
    const sidebar = page.getByRole("complementary", { name: "Barra lateral da Arena" });
    await sidebar.getByRole("button", { name, exact: true }).click();

    const window = page.getByRole("dialog", { name: `Ficha de ${name}` });
    await expect(window).toBeVisible();
    await expect(window.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();

    const strength = window.getByRole("group", { name: "Força" });
    await strength.getByRole("textbox", { name: "Valor de Força" }).fill("14");
    await expect(window.getByText("Salvo")).toBeVisible();
    await expect
      .poll(async () => {
        const { attributes } = (await readSheet()).sheet as unknown as {
          attributes: Record<string, { value: number | null }>;
        };
        return attributes.for?.value;
      })
      .toBe(14);

    await strength.getByRole("button", { name: /Rolar teste de Força/ }).click();
    await expect(page.getByRole("button", { name: "Fechar (Esc)" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Fechar (Esc)" })).toHaveCount(0);

    await window.getByRole("button", { name: `Fechar a ficha de ${name}` }).click();
    await expect(window).toHaveCount(0);
  });

  test("o Mestre abre duas fichas, a clicada vem para a frente e cada uma fecha sozinha", async ({
    page,
  }) => {
    const { playerCharacterId, otherCharacterId } = e2eState();
    const [first, second] = await Promise.all([
      characterName(playerCharacterId),
      characterName(otherCharacterId),
    ]);
    await loginAs(page, GM);
    await openArena(page);
    const sidebar = page.getByRole("complementary", { name: "Barra lateral da Arena" });
    await sidebar.getByRole("searchbox").fill(first);
    await sidebar.getByRole("button", { name: first, exact: true }).click();
    await sidebar.getByRole("searchbox").fill(second);
    await sidebar.getByRole("button", { name: second, exact: true }).click();

    const firstWindow = page.getByRole("dialog", { name: `Ficha de ${first}` });
    const secondWindow = page.getByRole("dialog", { name: `Ficha de ${second}` });
    await expect(
      firstWindow.getByRole("heading", { level: 2, name: first, exact: true }),
    ).toBeVisible();
    await expect(
      secondWindow.getByRole("heading", { level: 2, name: second, exact: true }),
    ).toBeVisible();

    const zOf = (locator: typeof firstWindow) =>
      locator.evaluate((element) => Number(getComputedStyle(element).zIndex));
    expect(await zOf(secondWindow)).toBeGreaterThan(await zOf(firstWindow));
    await firstWindow.getByRole("heading", { level: 2, name: `Ficha de ${first}` }).click();
    await expect.poll(async () => (await zOf(firstWindow)) > (await zOf(secondWindow))).toBe(true);

    await secondWindow.getByRole("button", { name: `Fechar a ficha de ${second}` }).click();
    await expect(secondWindow).toHaveCount(0);
    await expect(firstWindow).toBeVisible();
  });

  test("a janela vira aba ao ser solta numa barra lateral e volta a ser janela", async ({
    page,
  }) => {
    const { playerCharacterId } = e2eState();
    const name = await characterName(playerCharacterId);
    await loginAs(page, PLAYER);
    await openArena(page);
    const sidebar = page.getByRole("complementary", { name: "Barra lateral da Arena" });
    await sidebar.getByRole("button", { name, exact: true }).click();
    const window = page.getByRole("dialog", { name: `Ficha de ${name}` });
    await expect(window).toBeVisible();

    const header = window.getByRole("heading", { level: 2, name: `Ficha de ${name}`, exact: true });
    const from = await header.boundingBox();
    const to = await sidebar.boundingBox();
    if (!from || !to) throw new Error("Janela ou barra fora da tela");
    await page.mouse.move(from.x + 40, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
    await page.mouse.up();

    await expect(window).toHaveCount(0);
    const tab = sidebar.getByRole("tab", { name });
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(sidebar.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
    await sidebar
      .getByRole("group", { name: "Força" })
      .getByRole("textbox", { name: "Valor de Força" })
      .fill("15");
    await expect
      .poll(async () => {
        const { attributes } = (await readSheet()).sheet as unknown as {
          attributes: Record<string, { value: number | null }>;
        };
        return attributes.for?.value;
      })
      .toBe(15);

    await sidebar
      .getByRole("button", { name: `Desencaixar a ficha de ${name} numa janela` })
      .click();
    await expect(window).toBeVisible();
    await expect(sidebar.getByRole("tab", { name })).toHaveCount(0);

    await window
      .getByRole("button", { name: `Encaixar a ficha de ${name} no painel de rolagens` })
      .click();
    const rolls = page.getByRole("complementary", { name: "Rolagens da mesa" });
    await expect(rolls.getByRole("tab", { name })).toHaveAttribute("aria-selected", "true");
    await rolls.getByRole("tab", { name: "Rolagens" }).click();
    await expect(rolls.getByRole("tab", { name: "Rolagens" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await rolls.getByRole("tab", { name }).click();
    await rolls.getByRole("button", { name: `Fechar a ficha de ${name}` }).click();
    await expect(rolls.getByRole("tab", { name })).toHaveCount(0);
  });
});
