import type { CharacterImageKind } from "@magista/shared";

export interface CharacterImagesDialogProps {
  characterId: string;
  characterName: string;
  /** Saved image paths ("/media/..."), as they come in the character DTO. */
  avatarUrl: string | null;
  artUrl: string | null;
  /** Error to show when the dialog opens (e.g. an upload that failed right after creating the sheet). */
  initialError?: string | null;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export interface IImageDraft {
  file: File | null;
  removed: boolean;
  error: string | null;
}

export type ImageDrafts = Record<CharacterImageKind, IImageDraft>;

export type ImageChange =
  | { kind: CharacterImageKind; action: "upload"; file: File }
  | { kind: CharacterImageKind; action: "remove" };
