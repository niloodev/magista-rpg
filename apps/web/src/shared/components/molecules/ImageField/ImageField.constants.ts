import type { ImageFieldShape } from "./ImageField.types";

export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

export const PREVIEW_CLASSES: Record<ImageFieldShape, string> = {
  circle:
    "m-1 h-24 w-24 rounded-full ring-2 ring-primary/50 ring-offset-2 ring-offset-void-900 bg-void-700",
  portrait: "h-36 w-24 border border-primary/40 bg-void-800",
  landscape: "h-24 w-36 border border-primary/40 bg-void-800",
};

export const IMAGE_FIT: Record<ImageFieldShape, string> = {
  circle: "object-cover",
  portrait: "object-contain",
  landscape: "object-cover",
};

export const PICK_LABELS = {
  replace: "Trocar imagem",
  empty: "Escolher ou arrastar imagem",
} as const;

export const REMOVE_LABEL = "Remover";

export const IMAGE_HINT = "PNG, JPG, WEBP ou GIF, até 8\u00a0MB.";

export const REMOVED_NOTE = "Será removida ao salvar.";

export const UNDO_LABEL = "Desfazer";

export const IMAGE_WRONG_TYPE = "Escolha uma imagem PNG, JPG, WEBP ou GIF.";

export const IMAGE_TOO_LARGE = "A imagem passa do limite de 8 MB.";
