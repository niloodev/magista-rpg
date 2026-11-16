import { isErrorResult } from "@magista/shared";
import { Router } from "express";

import { arenaController, arenaErrors } from "@/core/controllers/arena";
import { requireAuth } from "@/middlewares";
import {
  broadcastArenaScene,
  broadcastArenaToken,
  broadcastArenaTokenRemoved,
  broadcastArenaTokens,
  broadcastArenaTokensRemoved,
} from "@/realtime";

import { sendResult, viewerOf, type AuthedResponse } from "@/routes/routes.utils";
import { ARENA_ERROR_STATUS } from "./arena.routes.constants";
import { readMapUpload, readTokenImageUpload } from "./arena.routes.utils";

export const arenaRoutes = Router();

arenaRoutes.use(requireAuth);

arenaRoutes.get("/", async (req, res: AuthedResponse) => {
  const result = await arenaController.getView(viewerOf(res), req.query.sceneId);
  sendResult(res, result, ARENA_ERROR_STATUS);
});

arenaRoutes.get("/scenes", async (_req, res: AuthedResponse) => {
  sendResult(res, await arenaController.listScenes(viewerOf(res)), ARENA_ERROR_STATUS);
});

arenaRoutes.get("/library", async (_req, res: AuthedResponse) => {
  sendResult(res, await arenaController.listLibrary(viewerOf(res)), ARENA_ERROR_STATUS);
});

arenaRoutes.post("/library/move", async (req, res: AuthedResponse) => {
  const result = await arenaController.moveLibraryItem(viewerOf(res), req.body);
  sendResult(res, result, ARENA_ERROR_STATUS);
  if (!isErrorResult(result)) broadcastArenaScene(null, "gm", true);
});

arenaRoutes.post("/folders", async (req, res: AuthedResponse) => {
  const result = await arenaController.createFolder(viewerOf(res), req.body);
  if (sendResult(res, result, ARENA_ERROR_STATUS, 201)) broadcastArenaScene(null, "gm", true);
});

arenaRoutes.patch("/folders/:id", async (req, res: AuthedResponse) => {
  const result = await arenaController.renameFolder(viewerOf(res), req.params.id ?? "", req.body);
  if (sendResult(res, result, ARENA_ERROR_STATUS)) broadcastArenaScene(null, "gm", true);
});

arenaRoutes.delete("/folders/:id", async (req, res: AuthedResponse) => {
  const result = await arenaController.deleteFolder(viewerOf(res), req.params.id ?? "");
  if (sendResult(res, result, ARENA_ERROR_STATUS)) broadcastArenaScene(null, "gm", true);
});

arenaRoutes.post("/scenes", async (req, res: AuthedResponse) => {
  const result = await arenaController.createScene(viewerOf(res), req.body);
  const scene = sendResult(res, result, ARENA_ERROR_STATUS, 201);
  if (scene) broadcastArenaScene(scene.id, "gm");
});

arenaRoutes.patch("/scenes/:id", async (req, res: AuthedResponse) => {
  const result = await arenaController.renameScene(viewerOf(res), req.params.id ?? "", req.body);
  const changed = sendResult(res, result, ARENA_ERROR_STATUS);
  if (changed) broadcastArenaScene(changed.scene.id, changed.audience);
});

arenaRoutes.delete("/scenes/:id", async (req, res: AuthedResponse) => {
  const result = await arenaController.deleteScene(viewerOf(res), req.params.id ?? "");
  const removed = sendResult(res, result, ARENA_ERROR_STATUS);
  if (removed) broadcastArenaScene(removed.sceneId, removed.audience);
});

arenaRoutes.put("/scenes/:id/map", async (req, res: AuthedResponse) => {
  const viewer = viewerOf(res);
  if (viewer.role !== "GM") {
    sendResult(res, { error: arenaErrors.gmOnly }, ARENA_ERROR_STATUS);
    return;
  }
  const upload = await readMapUpload(req, res);
  if ("error" in upload) {
    sendResult(res, upload, ARENA_ERROR_STATUS);
    return;
  }
  const result = await arenaController.setSceneMap(viewer, req.params.id ?? "", upload);
  const changed = sendResult(res, result, ARENA_ERROR_STATUS);
  if (changed) broadcastArenaScene(changed.scene.id, changed.audience);
});

arenaRoutes.put("/scenes/:id/board", async (req, res: AuthedResponse) => {
  const result = await arenaController.setSceneBoard(viewerOf(res), req.params.id ?? "", req.body);
  const changed = sendResult(res, result, ARENA_ERROR_STATUS);
  if (changed) broadcastArenaScene(changed.scene.id, changed.audience);
});

arenaRoutes.put("/active", async (req, res: AuthedResponse) => {
  const result = await arenaController.setActiveScene(viewerOf(res), req.body);
  const changed = sendResult(res, result, ARENA_ERROR_STATUS);
  if (changed) broadcastArenaScene(changed.activeSceneId, "table");
});

arenaRoutes.post("/scenes/:id/tokens", async (req, res: AuthedResponse) => {
  const result = await arenaController.createToken(viewerOf(res), req.params.id ?? "", req.body);
  const created = sendResult(res, result, ARENA_ERROR_STATUS, 201);
  if (created) broadcastArenaToken(created);
});

arenaRoutes.post("/scenes/:id/tokens/copy", async (req, res: AuthedResponse) => {
  const result = await arenaController.copyTokens(viewerOf(res), req.params.id ?? "", req.body);
  const changes = sendResult(res, result, ARENA_ERROR_STATUS, 201);
  if (changes) broadcastArenaTokens(changes);
});

arenaRoutes.patch("/tokens", async (req, res: AuthedResponse) => {
  const result = await arenaController.updateTokens(viewerOf(res), req.body);
  const changes = sendResult(res, result, ARENA_ERROR_STATUS);
  if (changes) broadcastArenaTokens(changes);
});

arenaRoutes.delete("/tokens", async (req, res: AuthedResponse) => {
  const result = await arenaController.deleteTokens(viewerOf(res), req.body);
  const removals = sendResult(res, result, ARENA_ERROR_STATUS);
  if (removals) broadcastArenaTokensRemoved(removals);
});

arenaRoutes.patch("/tokens/:id", async (req, res: AuthedResponse) => {
  const result = await arenaController.updateToken(viewerOf(res), req.params.id ?? "", req.body);
  const changed = sendResult(res, result, ARENA_ERROR_STATUS);
  if (changed) broadcastArenaToken(changed);
});

arenaRoutes.delete("/tokens/:id", async (req, res: AuthedResponse) => {
  const result = await arenaController.deleteToken(viewerOf(res), req.params.id ?? "");
  const removed = sendResult(res, result, ARENA_ERROR_STATUS);
  if (removed) broadcastArenaTokenRemoved(removed);
});

arenaRoutes.delete("/tokens/:id/image", async (req, res: AuthedResponse) => {
  const result = await arenaController.removeTokenImage(viewerOf(res), req.params.id ?? "");
  const changed = sendResult(res, result, ARENA_ERROR_STATUS);
  if (changed) broadcastArenaToken(changed);
});

arenaRoutes.put("/tokens/:id/image", async (req, res: AuthedResponse) => {
  const viewer = viewerOf(res);
  if (viewer.role !== "GM") {
    sendResult(res, { error: arenaErrors.gmOnly }, ARENA_ERROR_STATUS);
    return;
  }
  const upload = await readTokenImageUpload(req, res);
  if ("error" in upload) {
    sendResult(res, upload, ARENA_ERROR_STATUS);
    return;
  }
  const result = await arenaController.setTokenImage(viewer, req.params.id ?? "", upload);
  const changed = sendResult(res, result, ARENA_ERROR_STATUS);
  if (changed) broadcastArenaToken(changed);
});
