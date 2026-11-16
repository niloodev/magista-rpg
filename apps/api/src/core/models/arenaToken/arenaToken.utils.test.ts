import { describe, expect, it } from "vitest";

import { tokenImageUrls, tokenStatusOf } from "./arenaToken.utils";

const ASSET = "media/6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90/full.webp";
const THUMB = "/media/media/6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90/thumb.webp";

describe("tokenImageUrls", () => {
  const images = (extra: object = {}) => ({
    avatarKey: null,
    artKey: null,
    figureKey: null,
    tokenStyle: "portrait",
    showTokenName: true,
    ...extra,
  });

  it("uses the NPC image, then the avatar, then the art, each with its thumbnail", () => {
    expect(tokenImageUrls(ASSET, "portrait", null)).toEqual({
      imageUrl: `/media/${ASSET}`,
      imageThumbUrl: THUMB,
      style: "portrait",
    });
    expect(
      tokenImageUrls(
        null,
        "portrait",
        images({ avatarKey: ASSET, artKey: "legacy/avatars/x.png" }),
      ),
    ).toEqual({ imageUrl: `/media/${ASSET}`, imageThumbUrl: THUMB, style: "portrait" });
    expect(tokenImageUrls(null, "portrait", images({ artKey: "legacy/avatars/x.png" }))).toEqual({
      imageUrl: "/media/legacy/avatars/x.png",
      imageThumbUrl: null,
      style: "portrait",
    });
    expect(tokenImageUrls(null, "portrait", null)).toEqual({
      imageUrl: null,
      imageThumbUrl: null,
      style: "portrait",
    });
  });

  it("draws an NPC as a figure only with its own image", () => {
    expect(tokenImageUrls(ASSET, "figure", null).style).toBe("figure");
    expect(tokenImageUrls(null, "figure", null).style).toBe("portrait");
  });

  it("follows the sheet's choice, falling back to the portrait without the isometric image", () => {
    const figure = "media/7a2d1c3f-9b54-4d5f-8c9e-3a4b2d6e8f01/full.webp";
    expect(
      tokenImageUrls(
        null,
        "portrait",
        images({ avatarKey: ASSET, figureKey: figure, tokenStyle: "figure" }),
      ),
    ).toMatchObject({ imageUrl: `/media/${figure}`, style: "figure" });
    expect(
      tokenImageUrls(null, "portrait", images({ avatarKey: ASSET, tokenStyle: "figure" })),
    ).toMatchObject({ imageUrl: `/media/${ASSET}`, style: "portrait" });
    expect(
      tokenImageUrls(null, "portrait", images({ avatarKey: ASSET, figureKey: figure })),
    ).toMatchObject({ imageUrl: `/media/${ASSET}`, style: "portrait" });
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
