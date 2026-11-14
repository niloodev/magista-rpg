import { readdir } from "node:fs/promises";
import { extname, join, parse } from "node:path";

import { MEDIA_EXTENSIONS } from "@/core/services/media";

/**
 * Finds "<baseName>.<image extension>" inside a folder, or null.
 */
export async function findImage(folder: string, baseName: string): Promise<string | null> {
  const files = await readdir(folder);
  const match = files.find(
    (file) =>
      parse(file).name.toLowerCase() === baseName &&
      (MEDIA_EXTENSIONS as readonly string[]).includes(extname(file).toLowerCase()),
  );
  return match ? join(folder, match) : null;
}
