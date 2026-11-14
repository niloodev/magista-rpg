import { isErrorResult, type ControllerResult } from "@magista/shared";
import type { Response } from "express";

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
