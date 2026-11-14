import type { ICharacterSummary } from "@magista/shared";
import { describe, expect, it } from "vitest";

import { createAppStore } from "@/modules/shell/store/appSlice/appSlice";

const character = (id: string, position: number) =>
  ({
    id,
    name: id,
    folderId: null,
    position,
    avatarUrl: null,
    tokenUrl: null,
    classKey: "sem-classe",
    level: 1,
    accountIds: [],
  }) satisfies ICharacterSummary;

describe("library slice", () => {
  it("moves optimistically and restores the snapshot on failure", () => {
    const store = createAppStore();
    store.getState().finishLibraryLoad({
      characters: [character("a", 0), character("b", 1)],
      folders: [],
      accounts: [],
    });
    const snapshot = store
      .getState()
      .applyLibraryMove({ kind: "character", id: "b", parentId: null, index: 0 });
    expect(store.getState().library.characters.find((c) => c.id === "b")?.position).toBe(0);
    store.getState().restoreLibraryData(snapshot);
    expect(store.getState().library.characters.find((c) => c.id === "b")?.position).toBe(1);
  });

  it("toggles and expands folders, forgetting the ones that no longer exist", () => {
    const store = createAppStore();
    store.getState().finishLibraryLoad({
      characters: [],
      folders: [
        { id: "f", name: "F", parentId: null, position: 0 },
        { id: "g", name: "G", parentId: "f", position: 0 },
      ],
      accounts: [],
    });
    store.getState().toggleLibraryFolder("f");
    store.getState().expandLibraryFolders(["f", "g"]);
    expect(store.getState().library.expandedFolderIds).toEqual(["f", "g"]);
    store.getState().toggleLibraryFolder("f");
    expect(store.getState().library.expandedFolderIds).toEqual(["g"]);
    store.getState().finishLibraryLoad({ characters: [], folders: [], accounts: [] });
    expect(store.getState().library.expandedFolderIds).toEqual([]);
  });
});
