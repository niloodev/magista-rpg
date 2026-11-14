import type { IFolder } from "@magista/shared";
import { describe, expect, it, vi } from "vitest";

import type { IFolderModels } from "@/core/models/folder";

import { createLibraryController } from "./library";
import { libraryErrors } from "./library.errors";

const ROOT_A = "0b6d3f6e-2b1a-4c1e-9f0a-7d1e2c3b4a50";
const CHILD = "1b6d3f6e-2b1a-4c1e-9f0a-7d1e2c3b4a51";
const ROOT_B = "2b6d3f6e-2b1a-4c1e-9f0a-7d1e2c3b4a52";
const CHARACTER = "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90";

const tree: IFolder[] = [
  { id: ROOT_A, name: "Campanha", parentId: null, position: 0 },
  { id: CHILD, name: "NPCs", parentId: ROOT_A, position: 0 },
  { id: ROOT_B, name: "Arquivo", parentId: null, position: 1 },
];

function build(characterExists = true) {
  const folders: IFolderModels = {
    list: vi.fn().mockResolvedValue(tree),
    findById: vi.fn().mockImplementation(async (id) => tree.find((f) => f.id === id) ?? null),
    create: vi.fn().mockImplementation(async (input) => ({ id: "new", position: 2, ...input })),
    rename: vi.fn().mockImplementation(async (id, name) => ({ ...tree[0], id, name })),
    remove: vi.fn().mockResolvedValue(undefined),
    moveFolder: vi.fn().mockResolvedValue(undefined),
    moveCharacter: vi.fn().mockResolvedValue(undefined),
  };
  const characters = { exists: vi.fn().mockResolvedValue(characterExists) };
  return { folders, controller: createLibraryController({ folders, characters }) };
}

const gm = { accountId: "gm", role: "GM" as const };
const player = { accountId: "p", role: "PLAYER" as const };

describe("library controller", () => {
  it("is GM only", async () => {
    const { controller } = build();
    expect(await controller.listFolders(player)).toEqual({ error: libraryErrors.gmOnly });
    expect(await controller.createFolder(player, { name: "X" })).toEqual({
      error: libraryErrors.gmOnly,
    });
    expect(
      await controller.moveItem(player, { kind: "folder", id: CHILD, parentId: null, index: 0 }),
    ).toEqual({ error: libraryErrors.gmOnly });
  });

  it("creates folders inside existing parents only", async () => {
    const { controller } = build();
    expect(await controller.createFolder(gm, { name: "Vilões", parentId: ROOT_A })).toMatchObject({
      payload: { name: "Vilões", parentId: ROOT_A },
    });
    expect(await controller.createFolder(gm, { name: "" })).toEqual({
      error: libraryErrors.invalidName,
    });
    expect(await controller.createFolder(gm, { name: "X", parentId: CHARACTER })).toEqual({
      error: libraryErrors.folderNotFound,
    });
  });

  it("refuses to move a folder into itself or a descendant", async () => {
    const { controller, folders } = build();
    expect(
      await controller.moveItem(gm, { kind: "folder", id: ROOT_A, parentId: CHILD, index: 0 }),
    ).toEqual({ error: libraryErrors.cycle });
    expect(
      await controller.moveItem(gm, { kind: "folder", id: ROOT_A, parentId: ROOT_A, index: 0 }),
    ).toEqual({ error: libraryErrors.cycle });
    expect(
      await controller.moveItem(gm, { kind: "folder", id: CHILD, parentId: ROOT_B, index: 3 }),
    ).toMatchObject({ payload: null });
    expect(folders.moveFolder).toHaveBeenCalledWith(CHILD, ROOT_B, 3);
  });

  it("moves characters into folders and back to the root", async () => {
    const { controller, folders } = build();
    await controller.moveItem(gm, { kind: "character", id: CHARACTER, parentId: CHILD, index: 0 });
    await controller.moveItem(gm, { kind: "character", id: CHARACTER, parentId: null, index: 1 });
    expect(folders.moveCharacter).toHaveBeenNthCalledWith(1, CHARACTER, CHILD, 0);
    expect(folders.moveCharacter).toHaveBeenNthCalledWith(2, CHARACTER, null, 1);
    expect(
      await build(false).controller.moveItem(gm, {
        kind: "character",
        id: CHARACTER,
        parentId: null,
        index: 0,
      }),
    ).toEqual({ error: libraryErrors.characterNotFound });
  });

  it("deletes and renames existing folders", async () => {
    const { controller, folders } = build();
    expect(await controller.deleteFolder(gm, CHILD)).toMatchObject({ payload: { id: CHILD } });
    expect(folders.remove).toHaveBeenCalledWith(CHILD);
    expect(await controller.deleteFolder(gm, CHARACTER)).toEqual({
      error: libraryErrors.folderNotFound,
    });
    expect(await controller.renameFolder(gm, ROOT_B, { name: "Mortos" })).toMatchObject({
      payload: { name: "Mortos" },
    });
  });
});
