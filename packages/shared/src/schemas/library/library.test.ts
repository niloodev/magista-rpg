import { describe, expect, it } from "vitest";

import type { IFolder } from "./library.types";
import {
  buildFolderTree,
  flattenFolderTree,
  folderPath,
  insertAt,
  isSameOrDescendant,
  matchesSearch,
} from "./library.utils";

const folders: IFolder[] = [
  { id: "b", name: "NPCs", parentId: null, position: 1 },
  { id: "a", name: "Campanha", parentId: null, position: 0 },
  { id: "c", name: "Cidade", parentId: "b", position: 0 },
  { id: "d", name: "Taverna", parentId: "c", position: 0 },
];

describe("library utils", () => {
  it("builds an ordered tree with depths", () => {
    const tree = buildFolderTree(folders);
    expect(tree.map((node) => node.id)).toEqual(["a", "b"]);
    expect(flattenFolderTree(tree).map((node) => [node.id, node.depth])).toEqual([
      ["a", 0],
      ["b", 0],
      ["c", 1],
      ["d", 2],
    ]);
  });

  it("returns the path from the root and detects descendants", () => {
    expect(folderPath(folders, "d").map((folder) => folder.name)).toEqual([
      "NPCs",
      "Cidade",
      "Taverna",
    ]);
    expect(folderPath(folders, null)).toEqual([]);
    expect(isSameOrDescendant(folders, "d", "b")).toBe(true);
    expect(isSameOrDescendant(folders, "b", "b")).toBe(true);
    expect(isSameOrDescendant(folders, "a", "b")).toBe(false);
    expect(isSameOrDescendant(folders, null, "b")).toBe(false);
  });

  it("survives cycles in corrupted data", () => {
    const cyclic: IFolder[] = [
      { id: "x", name: "X", parentId: "y", position: 0 },
      { id: "y", name: "Y", parentId: "x", position: 0 },
    ];
    expect(folderPath(cyclic, "x")).toHaveLength(2);
  });

  it("matches searches ignoring case and accents", () => {
    expect(matchesSearch("Kaël Magnus", "kael")).toBe(true);
    expect(matchesSearch("Caçador da Névoa", "nevoa cac")).toBe(true);
    expect(matchesSearch("Kael", "zed")).toBe(false);
    expect(matchesSearch("Kael", "  ")).toBe(true);
  });

  it("inserts ids at a clamped index", () => {
    expect(insertAt(["a", "b", "c"], "a", 2)).toEqual(["b", "c", "a"]);
    expect(insertAt(["a", "b"], "z", 99)).toEqual(["a", "b", "z"]);
    expect(insertAt(["a", "b"], "b", 0)).toEqual(["b", "a"]);
  });
});
