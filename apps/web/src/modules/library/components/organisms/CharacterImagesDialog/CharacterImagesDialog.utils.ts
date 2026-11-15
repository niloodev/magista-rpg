import type { CharacterImageKind } from "@magista/shared";

import type { IImageDraft, ImageChange } from "./CharacterImagesDialog.types";

/**
 * What saving a draft has to do: upload the chosen file, remove the saved image, or nothing.
 */
export function imageChangeOf(
  kind: CharacterImageKind,
  draft: IImageDraft,
  savedUrl: string | null,
): ImageChange | null {
  if (draft.file) return { kind, action: "upload", file: draft.file };
  if (draft.removed && savedUrl) return { kind, action: "remove" };
  return null;
}
