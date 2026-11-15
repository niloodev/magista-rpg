import {
  ARENA_IMAGE_FIELD,
  ARENA_MAP_MAX_BYTES,
  ARENA_TOKEN_IMAGE_MAX_BYTES,
} from "@magista/shared";
import type { Request, Response } from "express";

import { arenaErrors, type ArenaError } from "@/core/controllers/arena";
import { createImageUpload, type ImageUploadResult } from "@/routes/routes.utils";

const mapUpload = createImageUpload(ARENA_IMAGE_FIELD, ARENA_MAP_MAX_BYTES);

const tokenUpload = createImageUpload(ARENA_IMAGE_FIELD, ARENA_TOKEN_IMAGE_MAX_BYTES);

function toArenaUpload(
  result: ImageUploadResult,
  tooLarge: ArenaError,
): { file: Buffer | undefined } | { error: ArenaError } {
  if (!("error" in result)) return result;
  return { error: result.error === "tooLarge" ? tooLarge : arenaErrors.imageMissing };
}

/**
 * Reads a scene map upload (up to 25 MB) into memory.
 */
export async function readMapUpload(req: Request, res: Response) {
  return toArenaUpload(await mapUpload(req, res), arenaErrors.mapTooLarge);
}

/**
 * Reads an NPC token image upload (up to 8 MB) into memory.
 */
export async function readTokenImageUpload(req: Request, res: Response) {
  return toArenaUpload(await tokenUpload(req, res), arenaErrors.imageTooLarge);
}
