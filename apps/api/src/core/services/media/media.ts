import { copyFile, lstat, mkdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

import { getEnv } from "@/core/services/env";

import { MEDIA_EXTENSIONS, MEDIA_FOLDERS, MEDIA_ROUTE } from "./media.constants";
import type { MediaKind } from "./media.types";

/**
 * Absolute folder where uploaded and imported media live.
 */
export function getMediaRoot(): string {
  return resolve(getEnv().MEDIA_DIR);
}

/**
 * Copies a local image into the media store and returns its public URL path.
 */
export async function storeMediaFile(
  kind: MediaKind,
  ownerId: string,
  sourcePath: string,
): Promise<string> {
  const extension = extname(sourcePath).toLowerCase();
  if (!(MEDIA_EXTENSIONS as readonly string[]).includes(extension)) {
    throw new Error(`Formato de imagem não suportado: ${extension}`);
  }
  if ((await lstat(sourcePath)).isSymbolicLink()) {
    throw new Error(`Links simbólicos não são aceitos: ${sourcePath}`);
  }
  const folder = MEDIA_FOLDERS[kind];
  const fileName = `${ownerId}${extension}`;
  await mkdir(join(getMediaRoot(), folder), { recursive: true });
  await copyFile(sourcePath, join(getMediaRoot(), folder, fileName));
  return `${MEDIA_ROUTE}/${folder}/${fileName}?v=${Date.now()}`;
}
