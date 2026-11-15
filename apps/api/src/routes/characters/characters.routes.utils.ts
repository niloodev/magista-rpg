import type { Request, Response } from "express";
import multer from "multer";

import { characterErrors } from "@/core/controllers/character";
import { MEDIA_MAX_BYTES } from "@/core/services/media";

import { IMAGE_FIELD } from "./characters.routes.constants";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MEDIA_MAX_BYTES, files: 1, fields: 0, parts: 1 },
}).single(IMAGE_FIELD);

/**
 * Reads the single multipart image into memory. Oversized or malformed uploads come back as a catalog error
 * instead of reaching the controller.
 */
export function readImageUpload(
  req: Request,
  res: Response,
): Promise<
  | { file: Buffer | undefined }
  | { error: typeof characterErrors.imageTooLarge | typeof characterErrors.imageMissing }
> {
  return new Promise((resolve) => {
    upload(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        resolve({ error: characterErrors.imageTooLarge });
        return;
      }
      if (error) {
        resolve({ error: characterErrors.imageMissing });
        return;
      }
      resolve({ file: req.file?.buffer });
    });
  });
}
