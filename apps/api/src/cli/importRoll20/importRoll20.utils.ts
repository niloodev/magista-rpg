import { lstat, readdir, readFile } from "node:fs/promises";
import { extname, join, parse } from "node:path";

import { IMPORT_VALUE_FLAGS, ROLL20_IMAGE_EXTENSIONS } from "./importRoll20.constants";
import type { IImportArgs } from "./importRoll20.types";

/**
 * Finds "<baseName>.<image extension>" inside a folder, or null.
 */
export async function findImage(folder: string, baseName: string): Promise<string | null> {
  const files = await readdir(folder);
  const match = files.find(
    (file) =>
      parse(file).name.toLowerCase() === baseName &&
      (ROLL20_IMAGE_EXTENSIONS as readonly string[]).includes(extname(file).toLowerCase()),
  );
  return match ? join(folder, match) : null;
}

/**
 * Reads "<baseName>.<image extension>" from a folder (symbolic links are refused), or null when absent.
 */
export async function readImage(folder: string, baseName: string): Promise<Buffer | null> {
  const path = await findImage(folder, baseName);
  if (!path) return null;
  if ((await lstat(path)).isSymbolicLink())
    throw new Error(`Links simbólicos não são aceitos: ${path}`);
  return readFile(path);
}

/**
 * Reads the command line of the importer: the folder, `--force`, any number of `--only "<name>"` (import just those
 * characters) and `--account "<login>"` (the player account that gets every imported character). Null when the
 * folder or the value of a flag is missing.
 */
export function parseImportArgs(args: readonly string[]): IImportArgs | null {
  const parsed: IImportArgs = { folder: "", force: false, only: [], account: null };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? "";
    if (arg === "--force") {
      parsed.force = true;
      continue;
    }
    if ((IMPORT_VALUE_FLAGS as readonly string[]).includes(arg)) {
      const value = args[index + 1]?.trim();
      if (!value || value.startsWith("--")) return null;
      index += 1;
      if (arg === "--only") parsed.only.push(value);
      else parsed.account = value;
      continue;
    }
    if (arg.startsWith("--") || parsed.folder) return null;
    parsed.folder = arg;
  }
  return parsed.folder ? parsed : null;
}

/**
 * Whether an export folder ("056 - Heylel, de Lux") is one of the names asked for: the name after the number,
 * or the whole folder name, ignoring case. No names means every folder.
 */
export function isWantedFolder(folderName: string, only: readonly string[]): boolean {
  if (only.length === 0) return true;
  const name = folderName.replace(/^\d+\s*-\s*/, "").toLowerCase();
  const whole = folderName.toLowerCase();
  return only.some((wanted) => {
    const value = wanted.toLowerCase();
    return value === name || value === whole;
  });
}
