import { randomUUID } from "node:crypto";

import type { CharacterImageKind } from "@magista/shared";

import {
  ARENA_MAP_MEDIA_PREFIX,
  ARENA_TOKEN_MEDIA_PREFIX,
  CHARACTER_MEDIA_PREFIX,
  IMAGE_TYPES,
  MEDIA_KEY_PATTERN,
  MEDIA_ROUTE,
} from "./media.constants";
import type { IImageType } from "./media.types";

const startsWith = (buffer: Buffer, bytes: number[], offset = 0) =>
  buffer.length >= offset + bytes.length && bytes.every((byte, i) => buffer[offset + i] === byte);

/**
 * Detects an image format from its leading bytes (the declared name and mimetype are never trusted).
 */
export function detectImageType(buffer: Buffer): IImageType | null {
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return IMAGE_TYPES.png;
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return IMAGE_TYPES.jpeg;
  if (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  )
    return IMAGE_TYPES.webp;
  if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38])) return IMAGE_TYPES.gif;
  return null;
}

/**
 * Builds a fresh object key for a character image; every upload gets a new key so URLs can be cached forever.
 */
export function mediaKeyFor(
  characterId: string,
  kind: CharacterImageKind,
  type: IImageType,
): string {
  return `${characterMediaPrefix(characterId)}${kind}-${randomUUID()}.${type.extension}`;
}

/**
 * Prefix that holds every object of one character.
 */
export function characterMediaPrefix(characterId: string): string {
  return `${CHARACTER_MEDIA_PREFIX}${characterId}/`;
}

/**
 * Prefix that holds every map uploaded for one Arena scene.
 */
export function arenaMapPrefix(sceneId: string): string {
  return `${ARENA_MAP_MEDIA_PREFIX}${sceneId}/`;
}

/**
 * Prefix that holds the image of one Arena token (NPCs).
 */
export function arenaTokenPrefix(tokenId: string): string {
  return `${ARENA_TOKEN_MEDIA_PREFIX}${tokenId}/`;
}

/**
 * Fresh key for an Arena scene map.
 */
export function arenaMapKeyFor(sceneId: string, type: IImageType): string {
  return `${arenaMapPrefix(sceneId)}map-${randomUUID()}.${type.extension}`;
}

/**
 * Fresh key for an Arena token image.
 */
export function arenaTokenKeyFor(tokenId: string, type: IImageType): string {
  return `${arenaTokenPrefix(tokenId)}token-${randomUUID()}.${type.extension}`;
}

/**
 * Whether a key has the shape the API writes (anything else is never served).
 */
export function isMediaKey(key: string): boolean {
  return MEDIA_KEY_PATTERN.test(key);
}

/**
 * Public URL path for a stored key.
 */
export function mediaUrlOf(key: string | null): string | null {
  return key ? `${MEDIA_ROUTE}/${key}` : null;
}

/**
 * Width and height read from the image header (PNG, JPEG, WEBP, GIF) without decoding it, or null when the
 * header cannot be read. Used to refuse maps too large for the GPUs of the table.
 */
export function readImageSize(buffer: Buffer): { width: number; height: number } | null {
  const type = detectImageType(buffer);
  if (!type) return null;
  if (type.extension === "png") {
    if (buffer.length < 24) return null;
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (type.extension === "gif") {
    if (buffer.length < 10) return null;
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  if (type.extension === "webp") return readWebpSize(buffer);
  return readJpegSize(buffer);
}

function readWebpSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30) return null;
  const chunk = buffer.toString("latin1", 12, 16);
  if (chunk === "VP8X")
    return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
  if (chunk === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8 ")
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  return null;
}

const JPEG_SIZE_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function readJpegSize(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1] ?? 0;
    const length = buffer.readUInt16BE(offset + 2);
    if (JPEG_SIZE_MARKERS.has(marker))
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    offset += 2 + length;
  }
  return null;
}
