import { lstat, readdir, readFile } from "node:fs/promises";
import { extname, join, parse } from "node:path";

import { ROLL20_IMAGE_EXTENSIONS } from "./importRoll20.constants";

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
