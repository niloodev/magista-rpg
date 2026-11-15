import { lstat, readdir, readFile } from "node:fs/promises";
import { join, parse, resolve } from "node:path";

import { ARENA_UNIT_PX, isErrorResult, type IArenaFolder, type IArenaScene } from "@magista/shared";

import { arenaController } from "@/core/controllers/arena";
import { disconnectDatabase } from "@/core/services/database";
import { ensureBucket } from "@/core/services/media";

import { CLI_VIEWER } from "./importRoll20Pages.constants";
import type { IRoll20Page } from "./importRoll20Pages.types";
import {
  boardOf,
  fitName,
  folderTree,
  parseArgs,
  parseFolderNames,
  parsePage,
  uniqueSceneNames,
} from "./importRoll20Pages.utils";

const fail = (message: string): never => {
  throw new Error(message);
};

/** Reads a file of the export, refusing symbolic links on the file and on the folders under the page. */
async function readExportFile(...parts: string[]): Promise<Buffer> {
  for (let depth = 2; depth <= parts.length; depth += 1) {
    const path = join(...parts.slice(0, depth));
    if ((await lstat(path)).isSymbolicLink()) fail(`links simbólicos não são aceitos: ${path}`);
  }
  return readFile(join(...parts));
}

async function readPages(root: string): Promise<IRoll20Page[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const pages: IRoll20Page[] = [];
  for (const entry of entries.filter((item) => item.isDirectory())) {
    try {
      const raw: unknown = JSON.parse(
        (await readExportFile(root, entry.name, "page.json")).toString("utf8"),
      );
      const page = parsePage(entry.name, raw);
      if (page) pages.push(page);
    } catch {
      console.warn(`- ${entry.name}: sem page.json válido, ignorado`);
    }
  }
  return pages.sort((a, b) => a.index - b.index || a.dir.localeCompare(b.dir));
}

async function readMap(root: string, page: IRoll20Page): Promise<Buffer | null> {
  if (!page.map) return null;
  const folder = join(root, page.dir, "graphics");
  const file = (await readdir(folder)).find((name) => parse(name).name === page.map?.id);
  if (!file) return fail(`imagem do mapa ${page.map.id} não encontrada em graphics/`);
  const path = join(folder, file);
  if ((await lstat(path)).isSymbolicLink())
    return fail(`links simbólicos não são aceitos: ${path}`);
  return readFile(path);
}

async function run(): Promise<void> {
  const options = parseArgs(process.argv.slice(2), process.env.INIT_CWD ?? ".", resolve);
  const overrides = options.foldersFile
    ? parseFolderNames(JSON.parse(await readFile(options.foldersFile, "utf8")))
    : {};
  const allPages = await readPages(options.root);
  const tree = folderTree(allPages, overrides);

  if (options.template) {
    for (const folder of tree) {
      const sample = allPages.filter((page) => page.folderPath.at(-1) === folder.id);
      console.error(
        `${folder.id}  ${folder.name}  <- ${sample.map((page) => page.dir).join(", ")}`,
      );
    }
    console.log(JSON.stringify(Object.fromEntries(tree.map((f) => [f.id, f.name])), null, 2));
    return;
  }

  await ensureBucket();
  const library = await arenaController.listLibrary(CLI_VIEWER);
  if (isErrorResult(library)) return fail(library.error);
  const folders: IArenaFolder[] = [...library.payload.folders];
  const scenes: IArenaScene[] = [...library.payload.scenes];

  const ensureFolder = async (name: string, parentId: string | null) => {
    const found = folders.find(
      (folder) => folder.parentId === parentId && folder.name.toLowerCase() === name.toLowerCase(),
    );
    if (found) return found.id;
    const created = await arenaController.createFolder(CLI_VIEWER, { name, parentId });
    if (isErrorResult(created)) return fail(`pasta "${name}": ${created.error}`);
    folders.push(created.payload);
    return created.payload.id;
  };

  const rootId = await ensureFolder(fitName(options.rootFolder), null);
  const folderIds = new Map<string, string>();
  const pages = allPages.filter((page) => !options.only || options.only.has(page.index));
  const needed = new Set(pages.flatMap((page) => page.folderPath));
  for (const folder of tree.filter((entry) => needed.has(entry.id))) {
    const parent = folder.parentId ? folderIds.get(folder.parentId) : rootId;
    folderIds.set(folder.id, await ensureFolder(folder.name, parent ?? rootId));
  }

  const discardScene = async (sceneId: string) => {
    const removed = await arenaController.deleteScene(CLI_VIEWER, sceneId);
    if (isErrorResult(removed))
      console.warn(`  ! a cena criada (${sceneId}) não foi apagada: ${removed.error}`);
    else
      scenes.splice(
        scenes.findIndex((scene) => scene.id === sceneId),
        1,
      );
  };

  const names = uniqueSceneNames(allPages);
  let failures = 0;
  for (const page of pages) {
    const name = names.get(page) ?? page.name;
    const folderId = folderIds.get(page.folderPath.at(-1) ?? "") ?? rootId;
    try {
      const existing = scenes.find(
        (scene) => scene.folderId === folderId && scene.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing && !options.force) {
        console.log(`= ${page.dir}: já existe, pulada`);
        continue;
      }
      const map = await readMap(options.root, page);
      let sceneId = existing?.id;
      if (!sceneId) {
        const created = await arenaController.createScene(CLI_VIEWER, { name, folderId });
        if (isErrorResult(created)) return fail(created.error);
        sceneId = created.payload.id;
        scenes.push(created.payload);
      }
      try {
        if (map) {
          const mapped = await arenaController.setSceneMap(CLI_VIEWER, sceneId, { file: map });
          if (isErrorResult(mapped)) fail(mapped.error);
        }
        const sized = await arenaController.setSceneBoard(CLI_VIEWER, sceneId, boardOf(page));
        if (isErrorResult(sized)) return fail(sized.error);
        const { width, height } = sized.payload.scene;
        const units = `${(width / ARENA_UNIT_PX).toFixed(1)} x ${(height / ARENA_UNIT_PX).toFixed(1)} unidades`;
        console.log(`${existing ? "~" : "+"} ${page.dir}: ${map ? units : `${units}, sem mapa`}`);
      } catch (error) {
        if (!existing) await discardScene(sceneId);
        throw error;
      }
    } catch (error) {
      failures += 1;
      console.error(`x ${page.dir}: ${error instanceof Error ? error.message : error}`);
    }
  }
  if (failures > 0) process.exitCode = 1;
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void disconnectDatabase());
