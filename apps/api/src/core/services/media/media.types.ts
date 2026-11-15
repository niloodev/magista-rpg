import type { CharacterImageKind } from "@magista/shared";
import type { Readable } from "node:stream";

import type { IMAGE_TYPES } from "./media.constants";

export type ImageTypeKey = keyof typeof IMAGE_TYPES;

export type IImageType = (typeof IMAGE_TYPES)[ImageTypeKey];

export interface IStoredObject {
  body: Readable;
  contentType: string;
  contentLength: number | undefined;
}

export interface IMediaStorage {
  putObject: (key: string, body: Buffer, contentType: string) => Promise<void>;
  getObject: (key: string) => Promise<IStoredObject | null>;
  deleteObject: (key: string) => Promise<void>;
  deletePrefix: (prefix: string) => Promise<void>;
  listKeys: (prefix?: string) => Promise<string[]>;
}

export interface ICharacterImageStore {
  /** Stores an image for a character and returns its new key, or null when the bytes are not a supported image. */
  store: (characterId: string, kind: CharacterImageKind, body: Buffer) => Promise<string | null>;
  remove: (key: string) => Promise<void>;
  removeAll: (characterId: string) => Promise<void>;
}

export interface IArenaImageStore {
  /** Stores a scene map and returns its new key, or null when the bytes are not a supported image. */
  storeMap: (sceneId: string, body: Buffer) => Promise<string | null>;
  /** Stores a token image and returns its new key, or null when the bytes are not a supported image. */
  storeToken: (tokenId: string, body: Buffer) => Promise<string | null>;
  remove: (key: string) => Promise<void>;
  removeScene: (sceneId: string) => Promise<void>;
  removeToken: (tokenId: string) => Promise<void>;
}
