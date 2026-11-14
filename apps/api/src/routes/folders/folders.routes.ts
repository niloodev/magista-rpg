import { Router } from "express";

import { libraryController } from "@/core/controllers/library";
import { requireAuth } from "@/middlewares";
import { broadcastLibraryChanged } from "@/realtime";
import { sendResult, viewerOf, type AuthedResponse } from "@/routes/routes.utils";
import { LIBRARY_ERROR_STATUS } from "./folders.routes.constants";

export const folderRoutes = Router();

folderRoutes.use(requireAuth);

folderRoutes.get("/", async (_req, res: AuthedResponse) => {
  sendResult(res, await libraryController.listFolders(viewerOf(res)), LIBRARY_ERROR_STATUS);
});

folderRoutes.post("/", async (req, res: AuthedResponse) => {
  const result = await libraryController.createFolder(viewerOf(res), req.body);
  if (sendResult(res, result, LIBRARY_ERROR_STATUS, 201)) broadcastLibraryChanged();
});

folderRoutes.patch("/:id", async (req, res: AuthedResponse) => {
  const result = await libraryController.renameFolder(viewerOf(res), req.params.id ?? "", req.body);
  if (sendResult(res, result, LIBRARY_ERROR_STATUS)) broadcastLibraryChanged();
});

folderRoutes.delete("/:id", async (req, res: AuthedResponse) => {
  const result = await libraryController.deleteFolder(viewerOf(res), req.params.id ?? "");
  if (sendResult(res, result, LIBRARY_ERROR_STATUS)) broadcastLibraryChanged();
});
