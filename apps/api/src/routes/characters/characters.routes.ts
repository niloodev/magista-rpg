import { CLIENT_ID_HEADER } from "@magista/shared";
import { Router } from "express";

import { characterController } from "@/core/controllers/character";
import { rollController } from "@/core/controllers/roll";
import { requireAuth } from "@/middlewares";
import {
  broadcastCharacterUpdate,
  broadcastLibraryChanged,
  broadcastRollResult,
  syncCharacterAccess,
} from "@/realtime";

import { sendResult, viewerOf, type AuthedResponse } from "@/routes/routes.utils";
import { CHARACTER_ERROR_STATUS, ROLL_ERROR_STATUS } from "./characters.routes.constants";

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
  if (renamed) broadcastLibraryChanged(renamed.accountIds);
});

characterRoutes.delete("/:id", async (req, res: AuthedResponse) => {
  const result = await characterController.deleteCharacter(viewerOf(res), req.params.id ?? "");
  const deleted = sendResult(res, result, CHARACTER_ERROR_STATUS);
  if (!deleted) return;
  syncCharacterAccess(deleted.id, deleted.previousAccountIds, []);
  broadcastLibraryChanged(deleted.previousAccountIds);
});

characterRoutes.put("/:id/access", async (req, res: AuthedResponse) => {
  const result = await characterController.setAccess(viewerOf(res), req.params.id ?? "", req.body);
  const changed = sendResult(res, result, CHARACTER_ERROR_STATUS);
  if (!changed) return;
  const { character, previousAccountIds } = changed;
  syncCharacterAccess(character.id, previousAccountIds, character.accountIds);
  broadcastLibraryChanged([...new Set([...previousAccountIds, ...character.accountIds])]);
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
