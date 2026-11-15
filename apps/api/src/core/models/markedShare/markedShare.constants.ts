export const SHARE_SELECT = {
  id: true,
  traitName: true,
  traitDescription: true,
  startedAt: true,
  source: { select: { id: true, name: true, avatarKey: true, artKey: true } },
} as const;

export const UNIQUE_VIOLATION = "P2002";
