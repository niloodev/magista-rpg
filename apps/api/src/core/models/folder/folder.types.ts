import type { IFolder } from "@magista/shared";

export interface IFolderModels {
  list: () => Promise<IFolder[]>;
  findById: (id: string) => Promise<IFolder | null>;
  create: (input: { name: string; parentId: string | null }) => Promise<IFolder>;
  rename: (id: string, name: string) => Promise<IFolder>;
  remove: (id: string) => Promise<void>;
  moveFolder: (id: string, parentId: string | null, index: number) => Promise<void>;
  moveCharacter: (id: string, folderId: string | null, index: number) => Promise<void>;
}
