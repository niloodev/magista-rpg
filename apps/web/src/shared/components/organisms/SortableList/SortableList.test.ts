import { describe, expect, it } from "vitest";

import { moveListItem, moveListItemById, reorderIndexes } from "./SortableList.utils";

describe("sortable list utils", () => {
  it("computes reorder indexes", () => {
    expect(reorderIndexes(["a", "b", "c"], "a", "c")).toEqual([0, 2]);
    expect(reorderIndexes(["a", "b", "c"], "c", "a")).toEqual([2, 0]);
    expect(reorderIndexes(["a", "b"], "a", "a")).toBeNull();
    expect(reorderIndexes(["a", "b"], "a", null)).toBeNull();
    expect(reorderIndexes(["a", "b"], "x", "a")).toBeNull();
  });

  it("moves items without touching the original list", () => {
    const list = ["a", "b", "c", "d"];
    expect(moveListItem(list, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveListItem(list, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(moveListItem(list, 1, 99)).toEqual(["a", "c", "d", "b"]);
    expect(list).toEqual(["a", "b", "c", "d"]);
  });

  it("moves by id against the current list", () => {
    const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(moveListItemById(list, "c", "a").map((item) => item.id)).toEqual(["c", "a", "b"]);
    const changed = [{ id: "x" }, ...list];
    expect(moveListItemById(changed, "c", "a").map((item) => item.id)).toEqual([
      "x",
      "c",
      "a",
      "b",
    ]);
    expect(moveListItemById(list, "zz", "a").map((item) => item.id)).toEqual(["a", "b", "c"]);
  });
});
