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
