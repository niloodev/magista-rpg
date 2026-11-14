import { isErrorResult } from "@magista/shared";

import { SAVE_CONFLICT_ERROR, SAVE_RECONCILE_ATTEMPTS } from "./SheetPage.constants";
import type { SaveAttemptOutcome, SheetSaveDeps } from "./SheetPage.types";

async function saveAttempt(deps: SheetSaveDeps): Promise<SaveAttemptOutcome> {
  const { character, revision, savedRevision } = deps.read();
  if (!character || revision === savedRevision) return "done";
  deps.markSaving();
  const result = await deps.save(character.id, character.sheet, character.updatedAt);
  if (!isErrorResult(result)) {
    deps.markSaved(character.id, revision, result.payload.updatedAt);
    return "done";
  }
  const latest = await deps.fetchLatest(character.id);
  if (!isErrorResult(latest) && latest.payload.updatedAt !== character.updatedAt) {
    deps.applyRemote(latest.payload);
    return "conflict";
  }
  deps.markFailed(character.id, result.error);
  return "done";
}

/**
 * Saves the pending sheet against its base version. When the server has a newer version, the remote
 * changes are reconciled into the draft and the save is retried a limited number of times; if it keeps
 * conflicting, the save is marked as failed so the user can retry instead of waiting forever.
 */
export async function saveWithReconcile(deps: SheetSaveDeps): Promise<void> {
  for (let attempt = 0; attempt <= SAVE_RECONCILE_ATTEMPTS; attempt += 1) {
    if ((await saveAttempt(deps)) === "done") return;
  }
  const { character } = deps.read();
  if (character) deps.markFailed(character.id, SAVE_CONFLICT_ERROR);
}
