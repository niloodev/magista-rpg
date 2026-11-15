import { CHARACTER_IMAGE_MAX_BYTES } from "@magista/shared";

export const MEDIA_ROUTE = "/media";

export const MEDIA_MAX_BYTES = CHARACTER_IMAGE_MAX_BYTES;

export const MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";

export const MEDIA_KEY_PATTERN =
  /^(characters\/[0-9a-f-]{36}\/(avatar|art)-[0-9a-f-]{36}|legacy\/(avatars|tokens)\/[0-9a-f-]{36}|arena\/maps\/[0-9a-f-]{36}\/map-[0-9a-f-]{36}|arena\/tokens\/[0-9a-f-]{36}\/token-[0-9a-f-]{36})\.(png|jpg|jpeg|webp|gif)$/;

export const CHARACTER_MEDIA_PREFIX = "characters/";

export const ARENA_MAP_MEDIA_PREFIX = "arena/maps/";

export const ARENA_TOKEN_MEDIA_PREFIX = "arena/tokens/";

export const IMAGE_TYPES = {
  png: { extension: "png", contentType: "image/png" },
  jpeg: { extension: "jpg", contentType: "image/jpeg" },
  webp: { extension: "webp", contentType: "image/webp" },
  gif: { extension: "gif", contentType: "image/gif" },
} as const;

/** WebP quality of an optimized scene map (visually the same as the PNG, about 7x smaller). */
export const MAP_WEBP_QUALITY = 90;

/** sharp encoder effort for maps (0 to 6): a good size without making the upload slow. */
export const MAP_WEBP_EFFORT = 4;

/** Largest side the WebP format can store; bigger maps keep their original format. */
export const MAP_WEBP_MAX_SIDE = 16_383;
