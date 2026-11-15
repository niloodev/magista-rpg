import { ARENA_NAME_MAX_LENGTH, ARENA_UNIT_PX, type IArenaBoardRequest } from "@magista/shared";

import { DEFAULT_ROOT_FOLDER, ROLL20_MAP_LAYER, USAGE } from "./importRoll20Pages.constants";
import type {
  IRoll20Folder,
  IRoll20MapGraphic,
  IRoll20Options,
  IRoll20Page,
} from "./importRoll20Pages.types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const numberOf = (value: unknown) => (typeof value === "number" && value > 0 ? value : 0);

/**
 * A name within the scene and folder limit, cutting the base so the suffix (" (2)") always fits.
 */
export function fitName(base: string, suffix = ""): string {
  return `${base.slice(0, ARENA_NAME_MAX_LENGTH - suffix.length).trimEnd()}${suffix}`;
}

/**
 * Gives a name not taken yet in a set of names (compared without case), adding " (2)", " (3)"... when needed.
 */
export function claimName(base: string, taken: Set<string>): string {
  let name = fitName(base);
  for (let count = 2; taken.has(name.toLowerCase()); count += 1)
    name = fitName(base, ` (${count})`);
  taken.add(name.toLowerCase());
  return name;
}

/**
 * Reads the command line: the export folder, the root scene folder, the page numbers to import, the folder names
 * file and the flags.
 */
export function parseArgs(
  args: string[],
  cwd: string,
  resolvePath: (...parts: string[]) => string,
) {
  const valueOf = (flag: string) => {
    const at = args.indexOf(flag);
    return at >= 0 ? (args[at + 1] ?? null) : null;
  };
  const flagged = new Set(
    ["--folder", "--only", "--folders"].flatMap((flag) => valueOf(flag) ?? []),
  );
  const folderArg = args.find((arg) => !arg.startsWith("--") && !flagged.has(arg));
  if (!folderArg) throw new Error(USAGE);
  const only = valueOf("--only");
  const foldersFile = valueOf("--folders");
  const options: IRoll20Options = {
    root: resolvePath(cwd, folderArg),
    rootFolder: valueOf("--folder")?.trim() || DEFAULT_ROOT_FOLDER,
    only: only
      ? new Set(
          only
            .split(",")
            .map((part) => Number.parseInt(part.trim(), 10))
            .filter(Number.isFinite),
        )
      : null,
    foldersFile: foldersFile ? resolvePath(cwd, foldersFile) : null,
    template: args.includes("--folders-template"),
    force: args.includes("--force"),
  };
  return options;
}

/**
 * The map of a page: the largest image on the Roll20 map layer (small decorations there are ignored).
 */
export function pickMapGraphic(graphics: unknown): IRoll20MapGraphic | null {
  if (!Array.isArray(graphics)) return null;
  let best: IRoll20MapGraphic | null = null;
  for (const graphic of graphics) {
    if (!isRecord(graphic) || graphic.layer !== ROLL20_MAP_LAYER || typeof graphic.id !== "string")
      continue;
    const width = numberOf(graphic.width);
    const height = numberOf(graphic.height);
    if (width === 0 || height === 0) continue;
    if (!best || width * height > best.width * best.height)
      best = { id: graphic.id, width, height };
  }
  return best;
}

/**
 * Parses a Roll20 `page.json` exported in "<number> - <name>" folders, or null when it is not a page.
 */
export function parsePage(dir: string, raw: unknown): IRoll20Page | null {
  if (!isRecord(raw) || typeof raw.name !== "string" || !raw.name.trim()) return null;
  const index = Number.parseInt(dir, 10);
  const path = typeof raw.path === "string" ? raw.path : "";
  return {
    dir,
    index: Number.isFinite(index) ? index : -1,
    name: raw.name.trim().replace(/\s+/g, " "),
    folderPath: path.split(",").filter(Boolean),
    width: numberOf(raw.width),
    height: numberOf(raw.height),
    map: pickMapGraphic(raw.graphics),
  };
}

/**
 * A name for a Roll20 folder (the export keeps only its id): the words every page inside it starts with, else
 * "Pasta N (first page)". A name from the folder names file always wins.
 */
export function folderNameFor(
  folderId: string,
  order: number,
  pages: IRoll20Page[],
  overrides: Record<string, string>,
): string {
  const chosen = overrides[folderId]?.trim();
  if (chosen) return chosen;
  const names = pages.filter((page) => page.folderPath.includes(folderId)).map((page) => page.name);
  const words = names.map((name) => name.split(" "));
  const prefix: string[] = [];
  for (let at = 0; at < (words[0]?.length ?? 0); at += 1) {
    const word = words[0]?.[at];
    if (!word || !words.every((list) => list[at] === word)) break;
    prefix.push(word);
  }
  while (prefix.length > 0 && /^[-(]/.test(prefix[prefix.length - 1] ?? "")) prefix.pop();
  if (prefix.length > 0 && names.length > 1) return prefix.join(" ");
  return names.length === 1 && names[0] ? names[0] : `Pasta ${order} (${names[0] ?? "vazia"})`;
}

/**
 * The Roll20 folder tree of the pages, parents before children, in the order the pages first use them; sibling
 * folders that would share a name get " (2)", so each Roll20 folder keeps its own scene folder.
 */
export function folderTree(
  pages: IRoll20Page[],
  overrides: Record<string, string>,
): IRoll20Folder[] {
  const folders: IRoll20Folder[] = [];
  const seen = new Set<string>();
  const namesByParent = new Map<string, Set<string>>();
  for (const page of pages) {
    page.folderPath.forEach((id, depth) => {
      if (seen.has(id)) return;
      seen.add(id);
      const parentId = depth > 0 ? (page.folderPath[depth - 1] ?? null) : null;
      const taken = namesByParent.get(parentId ?? "") ?? new Set<string>();
      namesByParent.set(parentId ?? "", taken);
      const name = claimName(folderNameFor(id, folders.length + 1, pages, overrides), taken);
      folders.push({ id, name, parentId });
    });
  }
  return folders;
}

/**
 * Scene names unique inside each folder (without case, within the name limit): a repeated name gets " (2)",
 * " (3)"... in page order, so running the import again finds the same scenes.
 */
export function uniqueSceneNames(pages: IRoll20Page[]): Map<IRoll20Page, string> {
  const takenByFolder = new Map<string, Set<string>>();
  const names = new Map<IRoll20Page, string>();
  for (const page of pages) {
    const folder = page.folderPath.at(-1) ?? "";
    const taken = takenByFolder.get(folder) ?? new Set<string>();
    takenByFolder.set(folder, taken);
    names.set(page, claimName(page.name, taken));
  }
  return names;
}

/**
 * The board of an imported page: as wide as the map image was placed on the Roll20 page (the height follows the
 * image), or the page size without a map.
 */
export function boardOf(page: IRoll20Page): IArenaBoardRequest {
  if (page.map) return { width: page.map.width };
  return { width: page.width * ARENA_UNIT_PX, height: page.height * ARENA_UNIT_PX };
}

/**
 * Reads the folder names file (`{ "<roll20 folder id>": "Name" }`), keeping only text values.
 */
export function parseFolderNames(raw: unknown): Record<string, string> {
  if (!isRecord(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw).flatMap(([id, value]) =>
      typeof value === "string" && value.trim() ? [[id, value.trim()]] : [],
    ),
  );
}
