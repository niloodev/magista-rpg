import { describe, expect, it } from "vitest";

import { characterSheetSchema } from "./character.schemas";
import {
  characterPortrait,
  createEmptySheet,
  exceedsResourceMax,
  mergeGmOnlyFields,
  sheetResourceOf,
} from "./character.utils";

describe("character sheet schema", () => {
  it("accepts the empty sheet", () => {
    expect(characterSheetSchema.safeParse(createEmptySheet()).success).toBe(true);
  });

  it("gives old sheets no preferred animations", () => {
    const old: Record<string, unknown> = { ...createEmptySheet() };
    delete old.effects;
    expect(characterSheetSchema.parse(old).effects).toEqual({});
  });

  it("rejects an unknown class", () => {
    const sheet = createEmptySheet();
    const invalid = { ...sheet, identity: { ...sheet.identity, class: "bardo" } };
    expect(characterSheetSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("resource limits and GM-only merge", () => {
  it("detects current values above the maximum", () => {
    const sheet = createEmptySheet();
    sheet.resources.health = { current: 10, max: 10 };
    expect(exceedsResourceMax(sheet)).toBe(false);
    sheet.resources.health.current = 11;
    expect(exceedsResourceMax(sheet)).toBe(true);
    sheet.resources.health.max = null;
    expect(exceedsResourceMax(sheet)).toBe(false);
  });

  it("keeps local edits but takes level and maximums from the server", () => {
    const local = createEmptySheet();
    local.identity.alignmentNote = "local";
    local.resources.health = { current: 30, max: 30 };
    const server = createEmptySheet();
    server.identity.level = 5;
    server.identity.class = "executor";
    server.resources.health = { current: 10, max: 25 };
    const merged = mergeGmOnlyFields(local, server);
    expect(merged.identity).toMatchObject({ class: "executor", level: 5, alignmentNote: "local" });
    expect(merged.resources.health).toEqual({ current: 25, max: 25 });
    expect(local.identity.level).toBe(1);
  });
});

describe("characterPortrait", () => {
  it("prefers the avatar, then the art, each by its thumbnail", () => {
    const none = { avatarUrl: null, artUrl: null };
    expect(characterPortrait(none)).toBeNull();
    expect(characterPortrait({ ...none, artUrl: "/art" })).toBe("/art");
    expect(characterPortrait({ ...none, artUrl: "/art", artThumbUrl: "/art-t" })).toBe("/art-t");
    expect(
      characterPortrait({
        avatarUrl: "/av",
        artUrl: "/art",
        avatarThumbUrl: "/av-t",
        artThumbUrl: "/art-t",
      }),
    ).toBe("/av-t");
  });
});

describe("sheetResourceOf", () => {
  it("reads a stored resource and falls back to an empty one", () => {
    expect(sheetResourceOf({ health: { current: 3, max: 9 } }, "health")).toEqual({
      current: 3,
      max: 9,
    });
    expect(sheetResourceOf({ health: { current: 3, max: 9 } }, "sanity")).toEqual({
      current: null,
      max: null,
    });
    expect(sheetResourceOf({ health: { current: "x" } }, "health")).toEqual({
      current: null,
      max: null,
    });
    expect(sheetResourceOf(null, "health")).toEqual({ current: null, max: null });
  });
});
