export const SUMMARY_SELECT = {
  id: true,
  name: true,
  avatarKey: true,
  artKey: true,
  folderId: true,
  position: true,
  sheet: true,
  sheetVersion: true,
  features: true,
  access: { select: { accountId: true }, orderBy: { createdAt: "asc" } },
} as const;
