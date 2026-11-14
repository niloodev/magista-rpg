export const SUMMARY_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  tokenUrl: true,
  folderId: true,
  position: true,
  sheet: true,
  sheetVersion: true,
  access: { select: { accountId: true }, orderBy: { createdAt: "asc" } },
} as const;
