import { CHARACTER_IMAGE_MAX_BYTES } from "@magista/shared";

export const MEDIA_ROUTE = "/media";

export const MEDIA_MAX_BYTES = CHARACTER_IMAGE_MAX_BYTES;

export const MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";

export const MEDIA_KEY_PATTERN =
  /^(characters\/[0-9a-f-]{36}\/(avatar|art)-[0-9a-f-]{36}|legacy\/(avatars|tokens)\/[0-9a-f-]{36})\.(png|jpg|jpeg|webp|gif)$/;

export const CHARACTER_MEDIA_PREFIX = "characters/";

export const IMAGE_TYPES = {
  png: { extension: "png", contentType: "image/png" },
  jpeg: { extension: "jpg", contentType: "image/jpeg" },
  webp: { extension: "webp", contentType: "image/webp" },
  gif: { extension: "gif", contentType: "image/gif" },
} as const;
