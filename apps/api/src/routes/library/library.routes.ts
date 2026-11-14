import { isErrorResult } from "@magista/shared";
import { Router } from "express";

import { libraryController } from "@/core/controllers/library";
import { requireAuth } from "@/middlewares";
import { broadcastLibraryChanged } from "@/realtime";
import { LIBRARY_ERROR_STATUS } from "@/routes/folders";
import { sendResult, viewerOf, type AuthedResponse } from "@/routes/routes.utils";

export const libraryRoutes = Router();

libraryRoutes.use(requireAuth);

libraryRoutes.post("/move", async (req, res: AuthedResponse) => {
  const result = await libraryController.moveItem(viewerOf(res), req.body);
  sendResult(res, result, LIBRARY_ERROR_STATUS);
  if (!isErrorResult(result)) broadcastLibraryChanged();
});
