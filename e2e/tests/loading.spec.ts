import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { GM, PLAYER } from "../support/env";
import { e2eState } from "../support/fixtures";
import { settleAnimations } from "../support/animations";
import { sectionBoxes } from "../support/geometry";
import { holdApi } from "../support/hold";
import { loginAs } from "../support/session";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"];

async function violations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations.map(
    (violation) => `${violation.id}: ${violation.nodes[0]?.target.join(" ")}`,
  );
}

const SHEET_SECTIONS = {
  summary: "main .md\\:top-0",
  tabs: "main .overflow-x-auto.border-b",
  panels: "main .p-5",
  attributeCards: "main [class*=glow-card]",
};

const TABLE_SECTIONS = {
  header: "main .border-b.border-border",
  library: "main .md\\:p-6",
  root: "main .min-h-11",
  folders: "main .min-h-14.border",
  folderBodies: "main .border-t-0.border-teal-500\\/50",
  characters: "main .min-h-16",
  presenceHeader: "main .border-l-4 > :first-child",
  feedCards: "main .max-h-\\[75vh\\] ol > li:nth-child(-n + 6)",
};

const LIBRARY_SECTIONS = {
  library: TABLE_SECTIONS.library,
  root: TABLE_SECTIONS.root,
  folders: TABLE_SECTIONS.folders,
  folderBodies: TABLE_SECTIONS.folderBodies,
  characters: TABLE_SECTIONS.characters,
};

const PRESENCE_ROWS = "main .border-l-4 li";

async function uniqueBoxes(page: Page, selector: string) {
  return [...new Set((await sectionBoxes(page, { rows: selector })).rows)].sort();
}

const HINTS_COOKIE = "magista-hints";

function busy(page: Page, label: string) {
  return page.locator(`[data-skeleton-region="${label}"][aria-busy=true]`);
}

test.describe("skeletons de carregamento", () => {
  test("biblioteca do Mestre mostra a árvore em skeleton e troca pelas pastas", async ({
    page,
  }) => {
    await loginAs(page, GM);
    const release = await holdApi(page, /^\/(characters|folders|accounts)$/);
    await page.reload();
    const skeleton = busy(page, "Carregando fichas...");
    await expect(skeleton).toBeVisible();
    await expect(skeleton.getByText("Todas as fichas")).toBeVisible();
    await expect(page.getByRole("list", { name: "Pastas e fichas" })).toHaveCount(0);
    await expect(page.getByText("Nenhuma ficha", { exact: true })).toHaveCount(0);
    expect(await violations(page)).toEqual([]);
    await release();
    await expect(skeleton).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Pastas e fichas" })).toBeVisible();
  });

  test("lista do jogador mostra linhas em skeleton e depois as fichas", async ({ page }) => {
    await loginAs(page, PLAYER);
    const release = await holdApi(page, /^\/characters$/);
    await page.reload();
    const skeleton = busy(page, "Carregando fichas...");
    await expect(skeleton).toBeVisible();
    await expect(page.getByText("Nenhuma ficha liberada", { exact: false })).toHaveCount(0);
    await release();
    await expect(skeleton).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Suas fichas" })).toBeVisible();
  });

  test("ficha mostra o layout em skeleton até a API responder", async ({ page }) => {
    await loginAs(page, PLAYER);
    const release = await holdApi(page, /^\/characters\/[^/]+$/);
    await page.goto(`/ficha/${e2eState().playerCharacterId}`);
    const skeleton = busy(page, "Carregando ficha...");
    await expect(skeleton).toBeVisible();
    await expect(skeleton.getByText("Atributos")).toBeVisible();
    await expect(skeleton.getByRole("heading")).toHaveCount(0);
    await expect(skeleton.getByRole("link", { name: "Voltar para a mesa" })).toBeVisible();
    await expect(page.getByRole("tablist")).toHaveCount(0);
    expect(await violations(page)).toEqual([]);
    await release();
    await expect(skeleton).toHaveCount(0);
    await expect(page.getByRole("tablist", { name: "Seções da ficha" })).toBeVisible();
  });

  test("sessão carregando mostra o skeleton da página pedida", async ({ page }) => {
    await loginAs(page, PLAYER);
    const release = await holdApi(page, /^\/auth\/me$/);
    await page.goto(`/ficha/${e2eState().playerCharacterId}`);
    await expect(busy(page, "Carregando ficha...")).toBeVisible();
    await release();
    await expect(page.getByRole("tablist", { name: "Seções da ficha" })).toBeVisible();

    const holdTable = await holdApi(page, /^\/auth\/me$/);
    await page.goto("/mesa");
    const table = busy(page, "Carregando a mesa...");
    await expect(table).toBeVisible();
    await expect(table.getByRole("status")).toHaveCount(1);
    await expect(table.locator("[data-skeleton-region]")).toHaveCount(0);
    expect(await violations(page)).toEqual([]);
    await holdTable();
    await expect(table).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  for (const width of [390, 1024, 1440]) {
    test(`skeleton da ficha tem as mesmas medidas da ficha pronta (${width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await loginAs(page, PLAYER);
      const release = await holdApi(page, /^\/characters\/[^/]+$/);
      await page.goto(`/ficha/${e2eState().playerCharacterId}`);
      await expect(busy(page, "Carregando ficha...")).toBeVisible();
      const skeleton = await sectionBoxes(page, SHEET_SECTIONS);
      await release();
      await expect(page.getByRole("tablist", { name: "Seções da ficha" })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await settleAnimations(page);
      expect(await sectionBoxes(page, SHEET_SECTIONS)).toEqual(skeleton);
    });
  }

  test("sessão do Mestre carregando já mostra a barra e a árvore do Mestre", async ({ page }) => {
    await loginAs(page, GM);
    await expect(page.getByRole("button", { name: "Nova pasta" })).toBeVisible();
    const release = await holdApi(page, /^\/auth\/me$/);
    await page.reload();
    const table = busy(page, "Carregando a mesa...");
    await expect(table).toBeVisible();
    await expect(table.getByText("Todas as fichas")).toBeVisible();
    await release();
    await expect(page.getByRole("button", { name: "Nova pasta" })).toBeVisible();
  });

  for (const { who, credentials } of [
    { who: "Mestre", credentials: GM },
    { who: "jogador", credentials: PLAYER },
  ]) {
    for (const width of [390, 1024, 1440]) {
      for (const { phase, hold } of [
        { phase: "sessão", hold: /^\/auth\/me$/ },
        { phase: "biblioteca", hold: /^\/(characters|folders|accounts)$/ },
      ]) {
        test(`skeleton da mesa (${who}, ${phase}, ${width}px) tem as medidas da mesa pronta`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height: 1000 });
          await loginAs(page, credentials);
          await expect(page.locator("main .min-h-16").first()).toBeVisible();
          await expect(page.getByText("Conectado", { exact: true })).toBeVisible();
          const release = await holdApi(page, hold);
          await page.reload();
          await expect(page.locator("[data-skeleton-region]").first()).toBeVisible();
          await settleAnimations(page);
          const skeleton = await sectionBoxes(page, TABLE_SECTIONS);
          const skeletonPresence = await uniqueBoxes(page, PRESENCE_ROWS);
          await release();
          await expect(page.locator("[data-skeleton-region]")).toHaveCount(0);
          await expect(page.getByText("Conectado", { exact: true })).toBeVisible();
          await page.evaluate(() => document.fonts.ready);
          await settleAnimations(page);
          expect(await sectionBoxes(page, TABLE_SECTIONS)).toEqual(skeleton);
          expect(await uniqueBoxes(page, PRESENCE_ROWS)).toEqual(skeletonPresence);
        });
      }
    }
  }

  test("sair apaga as dicas do aparelho, para a próxima conta não ver o formato da anterior", async ({
    page,
    context,
  }) => {
    const hints = async () =>
      (await context.cookies()).find((cookie) => cookie.name === HINTS_COOKIE)?.value ?? null;
    await loginAs(page, GM);
    await expect(page.locator("main .min-h-16").first()).toBeVisible();
    await expect(page.getByText("Conectado", { exact: true })).toBeVisible();
    await expect.poll(hints).not.toBeNull();
    const stored = JSON.parse(Buffer.from((await hints()) ?? "", "base64url").toString());
    expect(JSON.stringify(stored)).not.toMatch(new RegExp(GM.login, "i"));
    await page.getByRole("button", { name: "Sair" }).click();
    await page.waitForURL("**/login");
    await expect.poll(hints).toBeNull();
  });

  test("o HTML do servidor já sai no formato certo (Mestre), sem esperar o JavaScript", async ({
    browser,
    page,
    context,
  }) => {
    await loginAs(page, GM);
    await expect(page.locator("main .min-h-16").first()).toBeVisible();
    await expect(page.getByText("Conectado", { exact: true })).toBeVisible();
    const rows = await page.locator("main .min-h-16").count();
    const noScript = await browser.newContext({
      javaScriptEnabled: false,
      storageState: await context.storageState(),
    });
    const html = await noScript.newPage();
    await html.goto("/mesa");
    const region = html.locator('[data-skeleton-region="Carregando a mesa..."]');
    await expect(region).toBeVisible();
    await expect(region.getByText("Mestre da mesa")).toBeVisible();
    await expect(region.getByText("Nova pasta")).toBeVisible();
    await expect(region.getByText("Todas as fichas")).toBeVisible();
    await expect(html.locator("main .min-h-16")).toHaveCount(rows);
    await noScript.close();
  });

  test("árvore com pastas abertas, fechadas e vazias tem as medidas da árvore pronta", async ({
    page,
  }) => {
    const folders = [
      { id: "00000000-0000-4000-8000-000000000001", name: "Campanha", parentId: null, position: 0 },
      {
        id: "00000000-0000-4000-8000-000000000002",
        name: "NPCs da cidade",
        parentId: "00000000-0000-4000-8000-000000000001",
        position: 0,
      },
      { id: "00000000-0000-4000-8000-000000000003", name: "Vazia", parentId: null, position: 1 },
      {
        id: "00000000-0000-4000-8000-000000000004",
        name: "Arquivo morto",
        parentId: null,
        position: 2,
      },
    ];
    const sheet = (index: number, folderId: string | null, accountIds: string[]) => ({
      id: `00000000-0000-4000-8000-00000000010${index}`,
      name: ["Aldren Voss", "Bel", "Cassia Moreth", "Doran"][index] ?? "Eron",
      avatarUrl: null,
      tokenUrl: null,
      classKey: ["arcanista", "vanguardista", "cacador", "medium"][index] ?? "runico",
      level: index + 3,
      folderId,
      position: index,
      accountIds,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await loginAs(page, GM);
    await expect(page.locator("main .min-h-16").first()).toBeVisible();
    const characters = [
      sheet(0, folders[0]!.id, []),
      sheet(1, folders[1]!.id, []),
      sheet(2, null, []),
      sheet(3, folders[3]!.id, []),
    ];
    await page.route(/:3333\/folders$/, (route) =>
      route.fulfill({ json: { message: "ok", payload: folders } }),
    );
    await page.route(/:3333\/characters$/, (route) =>
      route.fulfill({ json: { message: "ok", payload: characters } }),
    );
    await page.evaluate(
      (ids) => localStorage.setItem("magista:library:expanded", JSON.stringify(ids)),
      [folders[0]!.id, folders[2]!.id],
    );
    await page.reload();
    await expect(page.locator("main .min-h-14.border")).toHaveCount(4);
    await expect(page.getByText("Pasta vazia. Arraste fichas para cá.")).toBeVisible();
    const release = await holdApi(page, /^\/(characters|folders|accounts)$/);
    await page.reload();
    await expect(busy(page, "Carregando fichas...")).toBeVisible();
    await settleAnimations(page);
    const skeleton = await sectionBoxes(page, LIBRARY_SECTIONS);
    await release();
    await expect(page.locator("[data-skeleton-region]")).toHaveCount(0);
    await settleAnimations(page);
    expect(await sectionBoxes(page, LIBRARY_SECTIONS)).toEqual(skeleton);
  });

  test("feed mostra skeleton, e não 'Nenhuma rolagem', enquanto a conexão não chega", async ({
    page,
  }) => {
    await loginAs(page, PLAYER);
    await expect(page.getByText("Conectado", { exact: true })).toBeVisible();
    await page.routeWebSocket(/socket\.io/, () => undefined);
    await page.reload();
    const feed = busy(page, "Carregando rolagens...");
    await expect(feed).toBeVisible();
    await expect(page.getByText("Nenhuma rolagem ainda.")).toHaveCount(0);
    await expect(feed.locator("li").first()).toBeVisible();
    expect(await violations(page)).toEqual([]);
    for (let step = 0; step < 25; step += 1) {
      await page.keyboard.press("Tab");
      const hiddenFocus = await page.evaluate(
        () => document.activeElement?.closest("[aria-hidden='true'], [inert]") !== null,
      );
      expect(hiddenFocus, `Tab ${step + 1} caiu em conteúdo escondido`).toBe(false);
    }
  });

  test("trocar de ficha não mostra a ficha anterior: vai direto ao skeleton e depois à nova", async ({
    page,
  }) => {
    const { playerCharacterId, otherCharacterId } = e2eState();
    await loginAs(page, GM);
    await page.goto(`/ficha/${playerCharacterId}`);
    await expect(page.getByRole("tablist", { name: "Seções da ficha" })).toBeVisible();
    const firstName = (await page.getByRole("heading", { level: 1 }).innerText()).trim();
    await page.getByRole("link", { name: "Voltar para a mesa" }).click();
    await page.waitForURL("**/mesa");
    await expect(page.locator(`a[href="/ficha/${otherCharacterId}"]`)).toBeVisible();
    const release = await holdApi(page, new RegExp(`^/characters/${otherCharacterId}$`));
    await page.evaluate(
      ({ name, path }) => {
        const flags = window as unknown as { __ghost?: boolean };
        flags.__ghost = false;
        const check = () => {
          if (!location.pathname.endsWith(path)) return;
          const shown = Array.from(document.querySelectorAll("h1")).some(
            (heading) => heading.textContent?.trim() === name,
          );
          if (shown) flags.__ghost = true;
        };
        new MutationObserver(check).observe(document.body, { childList: true, subtree: true });
      },
      { name: firstName, path: `/ficha/${otherCharacterId}` },
    );
    await page.locator(`a[href="/ficha/${otherCharacterId}"]`).click();
    await page.waitForURL(`**/ficha/${otherCharacterId}`);
    await expect(busy(page, "Carregando ficha...")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: firstName, exact: true })).toHaveCount(
      0,
    );
    await release();
    await expect(page.locator("[data-skeleton-region]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(firstName);
    expect(await page.evaluate(() => (window as unknown as { __ghost?: boolean }).__ghost)).toBe(
      false,
    );
  });
});
