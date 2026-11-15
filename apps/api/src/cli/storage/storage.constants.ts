export const USAGE = [
  "Uso:",
  '  npm run storage:dump -- "<pasta>"      copia todas as imagens do storage para a pasta',
  '  npm run storage:restore -- "<pasta>"   envia para o storage as imagens de um dump',
  '  npm run media:migrate-local -- "<pasta antiga>"   sobe a antiga MEDIA_DIR (avatars/, tokens/)',
].join("\n");

export const LEGACY_FOLDERS = ["avatars", "tokens"] as const;

export const LEGACY_PREFIX = "legacy";
