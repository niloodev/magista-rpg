import { z } from "zod";

export const FOLDER_NAME_MAX_LENGTH = 60;

export const LIBRARY_ITEM_KINDS = ["folder", "character"] as const;

export const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  position: z.number().int(),
});

export const folderIdSchema = z.uuid();

const folderNameSchema = z.string().trim().min(1).max(FOLDER_NAME_MAX_LENGTH);

export const createFolderInputSchema = z.object({
  name: folderNameSchema,
  parentId: z.uuid().nullable().default(null),
});

export const renameFolderInputSchema = z.object({ name: folderNameSchema });

export const moveLibraryItemInputSchema = z.object({
  kind: z.enum(LIBRARY_ITEM_KINDS),
  id: z.uuid(),
  parentId: z.uuid().nullable(),
  index: z.number().int().min(0).max(10_000),
});
