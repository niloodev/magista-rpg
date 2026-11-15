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
  /** Pixel size from the image header, or null when unreadable. */
  sizeOf: (body: Buffer) => { width: number; height: number } | null;
  remove: (key: string) => Promise<void>;
  removeAll: (characterId: string) => Promise<void>;
}

export interface IArenaImageStore {
  /** Pixel size from the image header, or null when unreadable. */
  sizeOf: (body: Buffer) => { width: number; height: number } | null;
  /** Pixel size of a stored map, read from its header, or null when missing or unreadable. */
  readMapSize: (key: string) => Promise<{ width: number; height: number } | null>;
  remove: (key: string) => Promise<void>;
  removeScene: (sceneId: string) => Promise<void>;
  removeToken: (tokenId: string) => Promise<void>;
}

export interface IStoredAssetFiles {
  key: string;
  thumbKey: string;
  bytes: number;
  contentType: string;
}

export interface IAssetFileStore {
  /** Writes the optimized image and its thumbnail of a new asset, or null when the bytes do not decode. */
  put: (assetId: string, body: Buffer) => Promise<IStoredAssetFiles | null>;
  /** Bytes of a stored object (to move older images into assets), or null when missing. */
  readOriginal: (key: string) => Promise<Buffer | null>;
  /** Deletes every file of an asset. */
  remove: (assetId: string) => Promise<void>;
  /** Deletes one stored object (an image from before assets existed). */
  removeKey: (key: string) => Promise<void>;
}
