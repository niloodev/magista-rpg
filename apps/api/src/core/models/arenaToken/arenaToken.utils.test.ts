import { describe, expect, it } from "vitest";

import { tokenImageUrls } from "./arenaToken.utils";

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
