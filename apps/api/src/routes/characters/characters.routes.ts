import { CLIENT_ID_HEADER } from "@magista/shared";
import { Router } from "express";

import { characterController, characterErrors } from "@/core/controllers/character";
import { rollController } from "@/core/controllers/roll";
import { requireAuth } from "@/middlewares";
import {
  broadcastArenaRefresh,
  broadcastCharacterFeatures,
  broadcastCharacterImages,
  broadcastCharacterUpdate,
  broadcastLibraryChanged,
  broadcastRollResult,
  syncCharacterAccess,
  refreshMarkedShare,
  syncMarkedCharacter,
} from "@/realtime";

import { sendResult, viewerOf, type AuthedResponse } from "@/routes/routes.utils";
import { CHARACTER_ERROR_STATUS, ROLL_ERROR_STATUS } from "./characters.routes.constants";
import { readImageUpload } from "./characters.routes.utils";

export const characterRoutes = Router();

characterRoutes.use(requireAuth);

characterRoutes.get("/", async (_req, res: AuthedResponse) => {
  sendResult(res, await characterController.listCharacters(viewerOf(res)), CHARACTER_ERROR_STATUS);
});

characterRoutes.post("/", async (req, res: AuthedResponse) => {
  const result = await characterController.createCharacter(viewerOf(res), req.body);
  if (sendResult(res, result, CHARACTER_ERROR_STATUS, 201)) broadcastLibraryChanged();
});

characterRoutes.get("/:id", async (req, res: AuthedResponse) => {
  const result = await characterController.getCharacter(viewerOf(res), req.params.id ?? "");
  sendResult(res, result, CHARACTER_ERROR_STATUS);
});

characterRoutes.patch("/:id", async (req, res: AuthedResponse) => {
  const result = await characterController.renameCharacter(
    viewerOf(res),
    req.params.id ?? "",
    req.body,
  );
  const renamed = sendResult(res, result, CHARACTER_ERROR_STATUS);
  if (!renamed) return;
  broadcastLibraryChanged(renamed.accountIds);
  broadcastArenaRefresh();
});

characterRoutes.delete("/:id", async (req, res: AuthedResponse) => {
  const result = await characterController.deleteCharacter(viewerOf(res), req.params.id ?? "");
  const deleted = sendResult(res, result, CHARACTER_ERROR_STATUS);
  if (!deleted) return;
  syncCharacterAccess(deleted.id, deleted.previousAccountIds, []);
  broadcastLibraryChanged(deleted.previousAccountIds);
  broadcastArenaRefresh();
  await syncMarkedCharacter(deleted.id);
});

characterRoutes.put("/:id/features", async (req, res: AuthedResponse) => {
  const result = await characterController.setFeatures(
    viewerOf(res),
    req.params.id ?? "",
    req.body,
  );
  const changed = sendResult(res, result, CHARACTER_ERROR_STATUS);
  if (!changed) return;
  broadcastCharacterFeatures({ id: changed.id, features: changed.features });
  broadcastLibraryChanged(changed.accountIds);
  if (changed.added.length > 0 || changed.removed.length > 0) await syncMarkedCharacter(changed.id);
});

characterRoutes.put("/:id/access", async (req, res: AuthedResponse) => {
  const result = await characterController.setAccess(viewerOf(res), req.params.id ?? "", req.body);
  const changed = sendResult(res, result, CHARACTER_ERROR_STATUS);
  if (!changed) return;
  const { character, previousAccountIds } = changed;
  syncCharacterAccess(character.id, previousAccountIds, character.accountIds);
  const affected = [...new Set([...previousAccountIds, ...character.accountIds])];
  broadcastLibraryChanged(affected);
  broadcastArenaRefresh(affected);
  await refreshMarkedShare(affected);
});

characterRoutes.put("/:id/sheet", async (req, res: AuthedResponse) => {
  const result = await characterController.updateSheet(
    viewerOf(res),
    req.params.id ?? "",
    req.body,
  );
  const saved = sendResult(res, result, CHARACTER_ERROR_STATUS);
  if (saved) broadcastCharacterUpdate(saved, req.get(CLIENT_ID_HEADER) ?? null);
});

characterRoutes.post("/:id/level-up", async (req, res: AuthedResponse) => {
  const result = await rollController.levelUp(viewerOf(res), req.params.id ?? "", req.body);
  const leveled = sendResult(res, result, ROLL_ERROR_STATUS);
  if (!leveled) return;
  broadcastCharacterUpdate(leveled.character, req.get(CLIENT_ID_HEADER) ?? null);
  broadcastRollResult(leveled.roll);
});

characterRoutes.put("/:id/images/:kind", async (req, res: AuthedResponse) => {
  const viewer = viewerOf(res);
  if (viewer.role !== "GM") {
    sendResult(res, { error: characterErrors.gmOnly }, CHARACTER_ERROR_STATUS);
    return;
  }
  const upload = await readImageUpload(req, res);
  if ("error" in upload) {
    sendResult(res, upload, CHARACTER_ERROR_STATUS);
    return;
  }
  const result = await characterController.setImage(viewer, req.params.id ?? "", {
    kind: req.params.kind ?? "",
    file: upload.file,
  });
  const changed = sendResult(res, result, CHARACTER_ERROR_STATUS);
  if (!changed) return;
  broadcastCharacterImages(changed.images);
  broadcastArenaRefresh();
});

characterRoutes.delete("/:id/images/:kind", async (req, res: AuthedResponse) => {
  const result = await characterController.removeImage(
    viewerOf(res),
    req.params.id ?? "",
    req.params.kind ?? "",
  );
  const changed = sendResult(res, result, CHARACTER_ERROR_STATUS);
  if (!changed) return;
  broadcastCharacterImages(changed.images);
  broadcastArenaRefresh();
});
