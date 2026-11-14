import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type WebSocketRoute } from "@playwright/test";

import { settleAnimations } from "../support/animations";
import { apiAs, payloadOf } from "../support/api";
import { dragTo, pressKeys } from "../support/drag";
import { GM, PLAYER } from "../support/env";
import { loginAs } from "../support/session";

const SUFFIX = Date.now().toString(36);
const NBSP = String.fromCharCode(160);
const FOLDER = `E2E Pasta ${SUFFIX}`;
const SUBFOLDER = `E2E Pasta Sub ${SUFFIX}`;
const FIRST = `E2E Ficha Um ${SUFFIX}`;
const SECOND = `E2E Ficha Dois ${SUFFIX}`;

interface LibraryCharacter {
  id: string;
  name: string;
  folderId: string | null;
  position: number;
  accountIds: string[];
}

interface LibraryFolder {
  id: string;
  name: string;
  parentId: string | null;
}

async function library() {
  const gm = await apiAs(GM);
  const characters = await payloadOf<LibraryCharacter[]>(await gm.get("/characters"));
  const folders = await payloadOf<LibraryFolder[]>(await gm.get("/folders"));
  await gm.dispose();
  return { characters, folders };
}

async function characterNamed(name: string) {
  return (await library()).characters.find((character) => character.name === name);
}

async function folderIdOf(name: string) {
  return (await library()).folders.find((folder) => folder.name === name)?.id;
}

async function axeViolations(page: Page) {
  await settleAnimations(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
}

const folderToggle = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`^${name} `) });

const row = (page: Page, name: string) =>
  page.locator("li", { has: page.getByRole("link", { name, exact: true }) }).last();

async function openMenu(page: Page, label: string, item: string) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.getByRole("menuitem", { name: item }).click();
}

async function expand(page: Page, name: string) {
  const toggle = folderToggle(page, name);
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
}

test.describe.configure({ mode: "serial" });

test.describe("biblioteca de fichas em árvore", () => {
  test.afterAll(async () => {
    const gm = await apiAs(GM);
    const characters = await payloadOf<LibraryCharacter[]>(await gm.get("/characters"));
    for (const character of characters.filter((c) => c.name.startsWith("E2E Ficha ")))
      await gm.delete(`/characters/${character.id}`);
    const folders = await payloadOf<LibraryFolder[]>(await gm.get("/folders"));
    for (const folder of folders.filter((f) => f.name.startsWith("E2E Pasta ")).reverse())
      await gm.delete(`/folders/${folder.id}`);
    await gm.dispose();
  });

  test("Mestre cria pasta, fichas dentro dela e libera uma para o jogador", async ({ page }) => {
    await loginAs(page, GM);
    await page.getByRole("button", { name: "Nova pasta" }).click();
    await page.getByLabel("Nome da pasta").fill(FOLDER);
    await page.getByRole("button", { name: "Criar pasta" }).click();
    await expect(folderToggle(page, FOLDER)).toHaveAttribute("aria-expanded", "false");

    for (const name of [FIRST, SECOND]) {
      await openMenu(page, `Ações da pasta ${FOLDER}`, "Nova ficha aqui");
      await page.getByLabel("Nome do personagem").fill(name);
      await page.getByRole("button", { name: "Criar ficha" }).click();
      await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(folderToggle(page, FOLDER)).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("list", { name: `Conteúdo de ${FOLDER}` })).toContainText(SECOND);

    await openMenu(page, `Ações de ${FIRST}`, "Acesso de jogadores");
    const dialog = page.getByRole("dialog", { name: `Acesso a ${FIRST}` });
    await dialog.getByRole("checkbox", { name: PLAYER.login }).check();
    await dialog.getByRole("button", { name: "Salvar acesso" }).click();
    await expect(dialog).toBeHidden();
    await expect(row(page, FIRST)).toContainText(PLAYER.login);

    const created = await characterNamed(FIRST);
    expect(created?.folderId).toBe(await folderIdOf(FOLDER));
    expect(created?.accountIds).toHaveLength(1);

    await folderToggle(page, FOLDER).click();
    await expect(page.getByRole("link", { name: FIRST, exact: true })).toHaveCount(0);
    await page.reload();
    await expect(folderToggle(page, FOLDER)).toHaveAttribute("aria-expanded", "false");
  });

  test("jogador vê só as fichas liberadas em lista, sem ações do Mestre, e busca", async ({
    page,
  }) => {
    await loginAs(page, PLAYER);
    await expect(page.getByRole("link", { name: FIRST, exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: SECOND, exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Nova pasta" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Ações de/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Mover / })).toHaveCount(0);
    await page.keyboard.press("/");
    const search = page.getByRole("searchbox", { name: "Buscar ficha pelo nome" });
    await expect(search).toBeFocused();
    await page.keyboard.type(`e2e ficha um ${SUFFIX}`);
    await expect(page.locator("a[href^='/ficha/']")).toHaveCount(1);
    expect(await axeViolations(page)).toEqual([]);
    await search.fill("zzz-nada");
    await expect(page.getByText("Nenhuma ficha com esse nome.")).toBeVisible();
  });

  test("Mestre reordena dentro da pasta arrastando antes de outra ficha", async ({ page }) => {
    await loginAs(page, GM);
    await expand(page, FOLDER);
    await dragTo(page, row(page, SECOND), row(page, FIRST), 0.15);
    await expect
      .poll(async () => {
        const { characters } = await library();
        const inFolder = characters
          .filter((c) => c.name === FIRST || c.name === SECOND)
          .sort((a, b) => a.position - b.position);
        return inFolder.map((c) => c.name);
      })
      .toEqual([SECOND, FIRST]);
    const list = page.getByRole("list", { name: `Conteúdo de ${FOLDER}` });
    await expect(list.locator("a[href^='/ficha/']").first()).toHaveText(SECOND);
  });

  test("Mestre tira a ficha da pasta pela zona da raiz e devolve soltando na pasta", async ({
    page,
  }) => {
    await loginAs(page, GM);
    await expand(page, FOLDER);
    const source = row(page, FIRST);
    await source.scrollIntoViewIfNeeded();
    const from = await source.boundingBox();
    if (!from) throw new Error("Linha fora da tela");
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 12, { steps: 4 });
    const zone = page.getByTestId("library-root-drop");
    await expect(zone).toHaveText("Solte aqui para tirar da pasta (raiz)");
    await zone.scrollIntoViewIfNeeded();
    const to = await zone.boundingBox();
    if (!to) throw new Error("Zona da raiz fora da tela");
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
    await page.mouse.up();
    await expect.poll(async () => (await characterNamed(FIRST))?.folderId).toBeNull();
    await expect(zone).toHaveText("Todas as fichas");

    await folderToggle(page, FOLDER).click();
    await expect(folderToggle(page, FOLDER)).toHaveAttribute("aria-expanded", "false");
    await page.setViewportSize({ width: 1440, height: 2200 });
    await dragTo(page, row(page, FIRST), folderToggle(page, FOLDER), 0.5);
    const folderId = await folderIdOf(FOLDER);
    await expect.poll(async () => (await characterNamed(FIRST))?.folderId).toBe(folderId);
    await expect(folderToggle(page, FOLDER)).toHaveAttribute("aria-expanded", "true");
    await expect(page).toHaveURL(/\/mesa$/);
  });

  test("soltar a ficha nela mesma não abre a ficha nem muda nada", async ({ page }) => {
    await loginAs(page, GM);
    await expand(page, FOLDER);
    const before = await characterNamed(SECOND);
    await dragTo(page, row(page, SECOND), row(page, SECOND), 0.5);
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/mesa$/);
    const after = await characterNamed(SECOND);
    expect([after?.folderId, after?.position]).toEqual([before?.folderId, before?.position]);
  });

  test("Mestre move pelo teclado (alça) e pelo Mover para, e cria subpasta", async ({ page }) => {
    await loginAs(page, GM);
    await expand(page, FOLDER);
    const handle = page.getByRole("button", { name: `Mover ficha ${FIRST}` });
    await handle.focus();
    await pressKeys(page, ["Space", "ArrowUp", "ArrowUp", "Space"]);
    await expect
      .poll(async () => {
        const { characters } = await library();
        return characters
          .filter((c) => c.name === FIRST || c.name === SECOND)
          .sort((a, b) => a.position - b.position)
          .map((c) => c.name);
      })
      .toEqual([FIRST, SECOND]);

    await openMenu(page, `Ações da pasta ${FOLDER}`, "Nova subpasta");
    await page.getByLabel("Nome da pasta").fill(SUBFOLDER);
    await page.getByRole("button", { name: "Criar pasta" }).click();
    await expect(folderToggle(page, SUBFOLDER)).toBeVisible();

    await openMenu(page, `Ações de ${SECOND}`, "Mover para...");
    const dialog = page.getByRole("dialog", { name: `Mover ${SECOND}` });
    await dialog.getByLabel("Destino").selectOption({ label: `${NBSP.repeat(6)}${SUBFOLDER}` });
    await dialog.getByRole("button", { name: "Mover" }).click();
    await expect(dialog).toBeHidden();
    const subfolderId = await folderIdOf(SUBFOLDER);
    await expect.poll(async () => (await characterNamed(SECOND))?.folderId).toBe(subfolderId);
    await expect(page.getByRole("list", { name: `Conteúdo de ${SUBFOLDER}` })).toContainText(
      SECOND,
    );
    expect(await axeViolations(page)).toEqual([]);
  });

  test("pasta não entra nela mesma nem numa subpasta", async ({ page }) => {
    await loginAs(page, GM);
    await expand(page, FOLDER);
    await expand(page, SUBFOLDER);
    await dragTo(page, folderToggle(page, FOLDER), folderToggle(page, SUBFOLDER), 0.5);
    await page.waitForTimeout(500);
    const { folders } = await library();
    expect(folders.find((folder) => folder.name === FOLDER)?.parentId).toBeNull();
  });

  test("busca do Mestre mostra o caminho e contas recusam login repetido", async ({ page }) => {
    await loginAs(page, GM);
    await page.getByRole("searchbox", { name: "Buscar ficha pelo nome" }).fill(SUFFIX);
    const results = page.getByRole("list", { name: "Resultados da busca" });
    await expect(results.locator("a[href^='/ficha/']")).toHaveCount(2);
    await expect(results).toContainText(`${FOLDER} / ${SUBFOLDER}`);
    expect(await axeViolations(page)).toEqual([]);
    await page.getByRole("searchbox", { name: "Buscar ficha pelo nome" }).fill("");
    await page.getByRole("button", { name: "Contas" }).click();
    const accounts = page.getByRole("dialog", { name: "Contas de jogador" });
    await accounts.getByLabel("Login").fill(PLAYER.login);
    await accounts.getByRole("button", { name: "Criar conta" }).click();
    await expect(accounts.getByText("Já existe uma conta com esse login.")).toBeVisible();
    expect(await axeViolations(page), "modal de contas").toEqual([]);
  });

  test("ao reconectar, a lista busca o que mudou enquanto estava sem conexão", async ({ page }) => {
    const state = { blocked: false, open: [] as WebSocketRoute[] };
    await page.routeWebSocket(/socket\.io/, (ws) => {
      if (state.blocked) {
        void ws.close();
        return;
      }
      ws.connectToServer();
      state.open.push(ws);
    });
    await loginAs(page, GM);
    await expect(page.getByText("Conectado", { exact: true })).toBeVisible();
    state.blocked = true;
    for (const ws of state.open) await ws.close();
    await expect(page.getByText("Conectado", { exact: true })).toHaveCount(0);
    const offlineFolder = `E2E Pasta Offline ${SUFFIX}`;
    const gm = await apiAs(GM);
    await gm.post("/folders", { data: { name: offlineFolder } });
    await gm.dispose();
    await page.waitForTimeout(500);
    await expect(folderToggle(page, offlineFolder)).toHaveCount(0);
    state.blocked = false;
    await expect(page.getByText("Conectado", { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(folderToggle(page, offlineFolder)).toBeVisible();
  });

  test("Mestre exclui ficha e pasta com confirmação; conteúdo sobe para a pasta acima", async ({
    page,
  }) => {
    await loginAs(page, GM);
    await expand(page, FOLDER);
    await openMenu(page, `Ações de ${FIRST}`, "Excluir");
    const confirm = page.getByRole("dialog", { name: "Excluir ficha" });
    await expect(confirm.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await confirm.getByRole("button", { name: "Excluir ficha" }).click();
    await expect(page.getByRole("link", { name: FIRST, exact: true })).toHaveCount(0);

    await openMenu(page, `Ações da pasta ${SUBFOLDER}`, "Excluir");
    await page
      .getByRole("dialog", { name: "Excluir pasta" })
      .getByRole("button", { name: "Excluir pasta" })
      .click();
    await expect(folderToggle(page, SUBFOLDER)).toHaveCount(0);
    await expect
      .poll(async () => (await characterNamed(SECOND))?.folderId)
      .toBe(await folderIdOf(FOLDER));
    expect(await characterNamed(FIRST)).toBeUndefined();
  });
});
