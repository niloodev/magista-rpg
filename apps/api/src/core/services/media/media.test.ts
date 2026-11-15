import { describe, expect, it } from "vitest";

import { IMAGE_TYPES } from "./media.constants";
import {
  arenaMapKeyFor,
  arenaTokenKeyFor,
  detectImageType,
  isMediaKey,
  mediaKeyFor,
  mediaUrlOf,
} from "./media.utils";

const ID = "6f1c2b8a-1d2e-4f3a-9b8c-7d6e5f4a3b2c";

describe("detectImageType", () => {
  it("recognizes each supported signature", () => {
    expect(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe(
      IMAGE_TYPES.png,
    );
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(IMAGE_TYPES.jpeg);
    expect(detectImageType(Buffer.from("RIFF0000WEBPVP8 ", "latin1"))).toBe(IMAGE_TYPES.webp);
    expect(detectImageType(Buffer.from("GIF89a", "latin1"))).toBe(IMAGE_TYPES.gif);
  });

  it("rejects anything else, even with an image-looking prefix", () => {
    expect(detectImageType(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(detectImageType(Buffer.from("RIFF0000WAVEfmt ", "latin1"))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });
});

describe("media keys", () => {
  it("builds a unique servable key per upload", () => {
    const first = mediaKeyFor(ID, "avatar", IMAGE_TYPES.png);
    const second = mediaKeyFor(ID, "avatar", IMAGE_TYPES.png);
    expect(first).toMatch(new RegExp(`^characters/${ID}/avatar-[0-9a-f-]{36}\\.png$`));
    expect(first).not.toBe(second);
    expect(isMediaKey(first)).toBe(true);
    expect(isMediaKey(mediaKeyFor(ID, "art", IMAGE_TYPES.jpeg))).toBe(true);
  });

  it("accepts legacy imported keys and refuses traversal or foreign keys", () => {
    expect(isMediaKey(`legacy/tokens/${ID}.png`)).toBe(true);
    expect(isMediaKey(`characters/${ID}/../secret.png`)).toBe(false);
    expect(isMediaKey(`other/${ID}.png`)).toBe(false);
    expect(isMediaKey(`legacy/tokens/${ID}xpng`)).toBe(false);
    expect(isMediaKey(`characters/${ID}/avatar-${ID}.svg`)).toBe(false);
  });

  it("builds servable Arena keys and refuses foreign Arena paths", () => {
    const map = arenaMapKeyFor(ID, IMAGE_TYPES.webp);
    const token = arenaTokenKeyFor(ID, IMAGE_TYPES.png);
    expect(map).toMatch(new RegExp(`^arena/maps/${ID}/map-[0-9a-f-]{36}\\.webp$`));
    expect(token).toMatch(new RegExp(`^arena/tokens/${ID}/token-[0-9a-f-]{36}\\.png$`));
    expect(isMediaKey(map)).toBe(true);
    expect(isMediaKey(token)).toBe(true);
    expect(isMediaKey(`arena/maps/${ID}/token-${ID}.png`)).toBe(false);
    expect(isMediaKey(`arena/other/${ID}/map-${ID}.png`)).toBe(false);
  });

  it("maps keys to public URLs", () => {
    expect(mediaUrlOf(`legacy/tokens/${ID}.png`)).toBe(`/media/legacy/tokens/${ID}.png`);
    expect(mediaUrlOf(null)).toBeNull();
  });
});
