import type { IArenaFolder } from "@magista/shared";

export interface IArenaSceneFolderModels {
  list: () => Promise<IArenaFolder[]>;
  findById: (id: string) => Promise<IArenaFolder | null>;
  /** Appends a folder after its siblings. */
  create: (name: string, parentId: string | null) => Promise<IArenaFolder>;
  rename: (id: string, name: string) => Promise<IArenaFolder | null>;
  /** Deletes the folder, moving its subfolders and scenes up to its parent; false when missing. */
  remove: (id: string) => Promise<boolean>;
  /** Moves a folder; returns false (and changes nothing) when the target is the folder or one inside it. */
  moveFolder: (id: string, parentId: string | null, index: number) => Promise<boolean>;
  moveScene: (id: string, folderId: string | null, index: number) => Promise<void>;
}
