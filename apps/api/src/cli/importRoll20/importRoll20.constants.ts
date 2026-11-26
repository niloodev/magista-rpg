export const ROLL20_IMAGE_EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg", ".gif"] as const;

export const IMPORT_USAGE =
  'Uso: npm run import:roll20 -- <pasta-dos-jogadores> [--force] [--only "<nome>"] [--account "<login>"]';

export const IMPORT_VALUE_FLAGS = ["--only", "--account"] as const;
