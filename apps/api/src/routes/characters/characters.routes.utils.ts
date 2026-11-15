import type { Request, Response } from "express";

import { characterErrors } from "@/core/controllers/character";
import { MEDIA_MAX_BYTES } from "@/core/services/media";
import { createImageUpload } from "@/routes/routes.utils";

import { IMAGE_FIELD } from "./characters.routes.constants";

const upload = createImageUpload(IMAGE_FIELD, MEDIA_MAX_BYTES);

/**
 * Reads the single multipart image into memory. Oversized or malformed uploads come back as a catalog error
 * instead of reaching the controller.
 */
export async function readImageUpload(
  req: Request,
  res: Response,
): Promise<
  | { file: Buffer | undefined }
  | { error: typeof characterErrors.imageTooLarge | typeof characterErrors.imageMissing }
> {
  const result = await upload(req, res);
  if (!("error" in result)) return result;
  return {
    error:
      result.error === "tooLarge" ? characterErrors.imageTooLarge : characterErrors.imageMissing,
  };
}
