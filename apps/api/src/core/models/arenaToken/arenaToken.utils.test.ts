import { describe, expect, it } from "vitest";

import { tokenImageUrls, tokenStatusOf } from "./arenaToken.utils";

const ASSET = "media/6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90/full.webp";
const THUMB = "/media/media/6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90/thumb.webp";

describe("tokenImageUrls", () => {
  it("uses the NPC image, then the avatar, then the art, each with its thumbnail", () => {
    expect(tokenImageUrls(ASSET, null)).toEqual({
      imageUrl: `/media/${ASSET}`,
      imageThumbUrl: THUMB,
    });
    expect(tokenImageUrls(null, { avatarKey: ASSET, artKey: "legacy/avatars/x.png" })).toEqual({
      imageUrl: `/media/${ASSET}`,
      imageThumbUrl: THUMB,
    });
    expect(tokenImageUrls(null, { avatarKey: null, artKey: "legacy/avatars/x.png" })).toEqual({
      imageUrl: "/media/legacy/avatars/x.png",
      imageThumbUrl: null,
    });
    expect(tokenImageUrls(null, null)).toEqual({ imageUrl: null, imageThumbUrl: null });
  });
});

describe("tokenStatusOf", () => {
  const row = {
    id: "t",
    sceneId: "s",
    hidden: false,
    healthCurrent: 4,
    healthMax: 10,
    sanityCurrent: null,
    sanityMax: null,
    statusPublic: false,
    viewers: [],
  };

  it("reads the sheet resources of a character token, ignoring its own columns", () => {
    expect(
      tokenStatusOf({
        ...row,
        characterId: "c",
        resources: { health: { current: 7, max: 20 }, sanity: "broken" },
      }),
    ).toEqual({ health: { current: 7, max: 20 }, sanity: { current: null, max: null } });
    expect(tokenStatusOf({ ...row, characterId: "c", resources: null })).toEqual({
      health: { current: null, max: null },
      sanity: { current: null, max: null },
    });
  });

  it("reads the own columns of an NPC", () => {
    expect(tokenStatusOf({ ...row, characterId: null, resources: null })).toEqual({
      health: { current: 4, max: 10 },
      sanity: { current: null, max: null },
    });
  });
});
