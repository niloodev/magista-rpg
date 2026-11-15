import { isErrorResult, type ControllerResult } from "@magista/shared";
import type { Request, Response } from "express";
import multer from "multer";

import type { IViewer } from "@/core/controllers/controllers.types";
import type { IAuthLocals } from "@/middlewares";

export type AuthedResponse = Response<unknown, IAuthLocals>;

/**
 * Reads the authenticated viewer (account and role loaded from the database by requireAuth).
 */
export function viewerOf(res: AuthedResponse): IViewer {
  return { accountId: res.locals.auth.accountId, role: res.locals.auth.role };
}

/**
 * Writes a controller envelope as the HTTP response, mapping errors to their status.
 * Returns the payload on success so the route can broadcast it.
 */
export function sendResult<T, E extends string>(
  res: AuthedResponse,
  result: ControllerResult<T, E>,
  statusOf: Record<E, number>,
  successStatus = 200,
): T | null {
  if (isErrorResult(result)) {
    res.status(statusOf[result.error]).json(result);
    return null;
  }
  res.status(successStatus).json(result);
  return result.payload;
}

export type ImageUploadResult = { file: Buffer | undefined } | { error: "tooLarge" | "missing" };

/**
 * Builds a reader for one multipart image field kept in memory. Oversized or malformed uploads resolve to a
 * failure kind that each route maps to its own catalog error, so nothing reaches the controller.
 */
export function createImageUpload(
  field: string,
  maxBytes: number,
): (req: Request, res: Response) => Promise<ImageUploadResult> {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields: 0, parts: 1 },
  }).single(field);
  return (req, res) =>
    new Promise((resolve) => {
      upload(req, res, (error: unknown) => {
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
          resolve({ error: "tooLarge" });
          return;
        }
        if (error) {
          resolve({ error: "missing" });
          return;
        }
        resolve({ file: req.file?.buffer });
      });
    });
}
