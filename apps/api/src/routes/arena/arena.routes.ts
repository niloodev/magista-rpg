import { Router } from "express";

import { arenaController, arenaErrors } from "@/core/controllers/arena";
import { requireAuth } from "@/middlewares";
import { broadcastArenaScene, broadcastArenaToken, broadcastArenaTokenRemoved } from "@/realtime";

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

arenaRoutes.patch("/tokens", async (req, res: AuthedResponse) => {
  const result = await arenaController.updateTokens(viewerOf(res), req.body);
  const changes = sendResult(res, result, ARENA_ERROR_STATUS);
  for (const change of changes ?? []) broadcastArenaToken(change);
});

arenaRoutes.delete("/tokens", async (req, res: AuthedResponse) => {
  const result = await arenaController.deleteTokens(viewerOf(res), req.body);
  const removals = sendResult(res, result, ARENA_ERROR_STATUS);
  for (const removal of removals ?? []) broadcastArenaTokenRemoved(removal);
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
