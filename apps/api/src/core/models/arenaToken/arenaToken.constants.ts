export const TOKEN_INCLUDE = {
  character: {
    select: { name: true, avatarKey: true, artKey: true, figureKey: true, tokenStyle: true },
  },
} as const;

export const TOKEN_ORDER = [{ position: "asc" as const }, { createdAt: "asc" as const }];
