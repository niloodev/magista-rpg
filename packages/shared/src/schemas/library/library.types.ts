import type { z } from "zod";

import type {
  createFolderInputSchema,
  folderSchema,
  LIBRARY_ITEM_KINDS,
  moveLibraryItemInputSchema,
  renameFolderInputSchema,
} from "./library.schemas";

export type IFolder = z.infer<typeof folderSchema>;

export type LibraryItemKind = (typeof LIBRARY_ITEM_KINDS)[number];

export type ICreateFolderInput = z.infer<typeof createFolderInputSchema>;

export type IRenameFolderInput = z.infer<typeof renameFolderInputSchema>;

export type IMoveLibraryItemInput = z.infer<typeof moveLibraryItemInputSchema>;

export interface IFolderNode extends IFolder {
  children: IFolderNode[];
  depth: number;
}
