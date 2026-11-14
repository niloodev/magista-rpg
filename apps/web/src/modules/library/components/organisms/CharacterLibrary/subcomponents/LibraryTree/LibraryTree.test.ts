import { describe, expect, it } from "vitest";

import { excludedDropIds, keyboardSlots, nextSlot } from "./LibraryTree.utils";

const rect = (top: number, height = 100) => ({ top, height });

describe("library tree utils", () => {
  it("offers before, inside and after stops depending on what is dragged", () => {
    const rows = [
      { kind: "root", rect: rect(0, 40) },
      { kind: "folder", rect: rect(100) },
      { kind: "character", rect: rect(300) },
    ];
    expect(keyboardSlots("folder", rows)).toEqual([20, 112, 150, 188]);
    expect(keyboardSlots("character", rows)).toEqual([20, 150, 325, 375]);
  });

  it("walks to the next stop up or down and stops at the ends", () => {
    const slots = [20, 150, 325, 375];
    expect(nextSlot(slots, 375, "up")).toBe(325);
    expect(nextSlot(slots, 325, "up")).toBe(150);
    expect(nextSlot(slots, 150, "down")).toBe(325);
    expect(nextSlot(slots, 375, "down")).toBeNull();
    expect(nextSlot(slots, 20, "up")).toBeNull();
  });

  it("excludes the dragged folder and everything inside it", () => {
    const data = {
      folders: [
        { id: "a", name: "A", parentId: null, position: 0 },
        { id: "b", name: "B", parentId: "a", position: 0 },
        { id: "c", name: "C", parentId: null, position: 1 },
      ],
      characters: [
        {
          id: "x",
          name: "X",
          folderId: "b",
          position: 0,
          avatarUrl: null,
          tokenUrl: null,
          classKey: "sem-classe" as const,
          level: 1,
          accountIds: [],
        },
      ],
    };
    expect(excludedDropIds(data, "folder:a").sort()).toEqual(
      ["character:x", "folder:a", "folder:b"].sort(),
    );
    expect(excludedDropIds(data, "character:x")).toEqual(["character:x"]);
  });
});
