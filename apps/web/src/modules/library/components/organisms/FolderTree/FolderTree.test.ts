import { describe, expect, it, vi } from "vitest";

import {
  createTreeRowStore,
  excludedDropIds,
  keyboardSlots,
  nextSlot,
  releasePoint,
} from "./FolderTree.utils";

const rect = (top: number, height = 100) => ({ top, height });

describe("folder tree utils", () => {
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
      leaves: [
        {
          id: "x",
          name: "X",
          folderId: "b",
          position: 0,
          avatarUrl: null,
          artUrl: null,
          avatarThumbUrl: null,
          artThumbUrl: null,
          figureUrl: null,
          figureThumbUrl: null,
          tokenStyle: "portrait",
          showTokenName: true,
          effects: {},
          classKey: "sem-classe" as const,
          level: 1,
          accountIds: [],
          features: [],
        },
      ],
    };
    expect([...excludedDropIds(data, "character", "folder:a")].sort()).toEqual(
      ["character:x", "folder:a", "folder:b"].sort(),
    );
    expect([...excludedDropIds(data, "character", "character:x")]).toEqual(["character:x"]);
  });

  it("offers leaf stops for any leaf kind", () => {
    const rows = [{ kind: "scene", rect: rect(0) }];
    expect(keyboardSlots("scene", rows)).toEqual([25, 75]);
    expect(keyboardSlots("folder", rows)).toEqual([]);
  });

  it("finds where a pointer drag was released", () => {
    const pointer = { clientX: 10, clientY: 20 } as unknown as Event;
    expect(releasePoint(pointer, { x: 5, y: -3 })).toEqual({ x: 15, y: 17 });
    expect(releasePoint({ key: "Enter" } as unknown as Event, { x: 1, y: 1 })).toBeNull();
  });
});

describe("createTreeRowStore", () => {
  it("answers per row and notifies only when the drag state changes", () => {
    const rows = createTreeRowStore();
    const listener = vi.fn();
    rows.subscribe(listener);
    const excluded = new Set(["folder:a"]);
    rows.set({ dragId: "character:x", position: "before" }, excluded);
    expect(rows.positionOf("character:x")).toBe("before");
    expect(rows.positionOf("character:y")).toBeNull();
    expect(rows.isExcluded("folder:a")).toBe(true);
    rows.set({ dragId: "character:x", position: "before" }, excluded);
    expect(listener).toHaveBeenCalledTimes(1);
    rows.set({ dragId: "character:x", position: "after" }, excluded);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
