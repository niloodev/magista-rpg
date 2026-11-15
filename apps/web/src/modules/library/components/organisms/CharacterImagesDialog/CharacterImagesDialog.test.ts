import { describe, expect, it } from "vitest";

import { EMPTY_DRAFT } from "./CharacterImagesDialog.constants";
import { imageChangeOf } from "./CharacterImagesDialog.utils";

const file = new File(["x"], "a.png", { type: "image/png" });

describe("imageChangeOf", () => {
  it("uploads a chosen file, even over a saved image", () => {
    expect(imageChangeOf("avatar", { ...EMPTY_DRAFT, file }, "/media/a.png")).toEqual({
      kind: "avatar",
      action: "upload",
      file,
    });
  });

  it("removes only when there is a saved image", () => {
    expect(imageChangeOf("art", { ...EMPTY_DRAFT, removed: true }, "/media/a.png")).toEqual({
      kind: "art",
      action: "remove",
    });
    expect(imageChangeOf("art", { ...EMPTY_DRAFT, removed: true }, null)).toBeNull();
  });

  it("does nothing for an untouched field", () => {
    expect(imageChangeOf("avatar", EMPTY_DRAFT, "/media/a.png")).toBeNull();
  });
});
