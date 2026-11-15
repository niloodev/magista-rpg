import { lstat, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";

/**
 * Every regular file under a folder (symbolic links are skipped), as paths relative to it with "/" separators.
 */
export async function listFiles(root: string, folder = root): Promise<string[]> {
  const entries = await readdir(folder, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(folder, entry.name);
    if ((await lstat(path)).isSymbolicLink()) continue;
    if (entry.isDirectory()) files.push(...(await listFiles(root, path)));
    else if (entry.isFile()) files.push(relative(root, path).split(sep).join("/"));
  }
  return files;
}
