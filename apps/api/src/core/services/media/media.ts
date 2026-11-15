import {
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import sharp from "sharp";

import { ARENA_MAP_MAX_PIXELS } from "@magista/shared";

import { getEnv } from "@/core/services/env";

import {
  MAP_WEBP_EFFORT,
  MAP_WEBP_MAX_SIDE,
  MAP_WEBP_QUALITY,
  MEDIA_ASSET_PREFIX,
  THUMB_MAX_SIDE,
  THUMB_WEBP_QUALITY,
} from "./media.constants";
import type {
  IArenaImageStore,
  IAssetFileStore,
  ICharacterImageStore,
  IMediaStorage,
} from "./media.types";
import {
  arenaMapPrefix,
  arenaTokenPrefix,
  assetKeysFor,
  characterMediaPrefix,
  detectImageType,
  readImageSize,
} from "./media.utils";

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  const env = getEnv();
  client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
    credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
  });
  return client;
}

const bucket = () => getEnv().S3_BUCKET;

/**
 * Creates the media bucket when it does not exist yet (called on boot and by the CLIs).
 */
export async function ensureBucket(): Promise<void> {
  try {
    await getClient().send(new HeadBucketCommand({ Bucket: bucket() }));
  } catch {
    await getClient().send(new CreateBucketCommand({ Bucket: bucket() }));
  }
}

const putObject: IMediaStorage["putObject"] = async (key, body, contentType) => {
  await getClient().send(
    new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType }),
  );
};

const getObject: IMediaStorage["getObject"] = async (key) => {
  try {
    const result = await getClient().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    if (!(result.Body instanceof Readable)) return null;
    return {
      body: result.Body,
      contentType: result.ContentType ?? "application/octet-stream",
      contentLength: result.ContentLength,
    };
  } catch (error) {
    if (error instanceof NoSuchKey || (error as { name?: string }).name === "NoSuchKey")
      return null;
    throw error;
  }
};

const deleteObject: IMediaStorage["deleteObject"] = async (key) => {
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
};

const listKeys: IMediaStorage["listKeys"] = async (prefix) => {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const page = await getClient().send(
      new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix, ContinuationToken: token }),
    );
    for (const entry of page.Contents ?? []) if (entry.Key) keys.push(entry.Key);
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return keys;
};

const deletePrefix: IMediaStorage["deletePrefix"] = async (prefix) => {
  const keys = await listKeys(prefix);
  for (let start = 0; start < keys.length; start += 1000) {
    await getClient().send(
      new DeleteObjectsCommand({
        Bucket: bucket(),
        Delete: { Objects: keys.slice(start, start + 1000).map((Key) => ({ Key })) },
      }),
    );
  }
};

/**
 * S3-compatible object storage (SeaweedFS locally) holding every uploaded image.
 */
export const mediaStorage: IMediaStorage = {
  putObject,
  getObject,
  deleteObject,
  deletePrefix,
  listKeys,
};

/**
 * Character images on top of the object storage: validates the file signature and writes under the character prefix.
 */
export function createCharacterImageStore(storage: IMediaStorage): ICharacterImageStore {
  return {
    sizeOf: readImageSize,
    remove: (key) => storage.deleteObject(key),
    removeAll: (characterId) => storage.deletePrefix(characterMediaPrefix(characterId)),
  };
}

export const characterImages = createCharacterImageStore(mediaStorage);

/**
 * Re-encodes a map as high quality WebP (Roll20 exports are uncompressed PNGs of up to 50 MB, which every player
 * would download). Animated GIFs, sides beyond the WebP limit, unreadable images and results that would not be
 * smaller keep the original bytes.
 */
export async function optimizeMap(body: Buffer): Promise<Buffer> {
  const type = detectImageType(body);
  const size = readImageSize(body);
  if (!type || type.extension === "gif" || !size) return body;
  if (size.width > MAP_WEBP_MAX_SIDE || size.height > MAP_WEBP_MAX_SIDE) return body;
  try {
    const optimized = await sharp(body, { limitInputPixels: ARENA_MAP_MAX_PIXELS })
      .webp({ quality: MAP_WEBP_QUALITY, effort: MAP_WEBP_EFFORT })
      .toBuffer();
    return optimized.length < body.length ? optimized : body;
  } catch {
    return body;
  }
}

/**
 * A small WebP version of an image (at most `THUMB_MAX_SIDE` on its largest side, the first frame of a GIF), or
 * null when the image cannot be decoded.
 */
export async function makeThumbnail(body: Buffer): Promise<Buffer | null> {
  try {
    return await sharp(body, { limitInputPixels: ARENA_MAP_MAX_PIXELS })
      .resize(THUMB_MAX_SIDE, THUMB_MAX_SIDE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: THUMB_WEBP_QUALITY })
      .toBuffer();
  } catch {
    return null;
  }
}

/**
 * Files of the shared image assets: each asset keeps its optimized image and its thumbnail under its own
 * folder, written once and never changed (so URLs can be cached forever).
 */
export function createAssetFileStore(storage: IMediaStorage): IAssetFileStore {
  return {
    put: async (assetId, body) => {
      if (!detectImageType(body)) return null;
      const thumb = await makeThumbnail(body);
      if (!thumb) return null;
      const full = await optimizeMap(body);
      const type = detectImageType(full);
      if (!type) return null;
      const keys = assetKeysFor(assetId, type);
      await storage.putObject(keys.key, full, type.contentType);
      await storage.putObject(keys.thumbKey, thumb, "image/webp");
      return { ...keys, bytes: full.length, contentType: type.contentType };
    },
    readOriginal: async (key) => {
      const stored = await storage.getObject(key);
      if (!stored) return null;
      const chunks: Buffer[] = [];
      for await (const chunk of stored.body) chunks.push(Buffer.from(chunk as Uint8Array));
      return Buffer.concat(chunks);
    },
    remove: (assetId) => storage.deletePrefix(`${MEDIA_ASSET_PREFIX}${assetId}/`),
    removeKey: (key) => storage.deleteObject(key),
  };
}

export const assetFiles = createAssetFileStore(mediaStorage);

/**
 * Arena images (scene maps and NPC token images) on top of the object storage, validated by file signature.
 */
export function createArenaImageStore(storage: IMediaStorage): IArenaImageStore {
  const readMapSize = async (key: string) => {
    const stored = await storage.getObject(key);
    if (!stored) return null;
    const chunks: Buffer[] = [];
    for await (const chunk of stored.body) chunks.push(Buffer.from(chunk as Uint8Array));
    return readImageSize(Buffer.concat(chunks));
  };
  return {
    sizeOf: readImageSize,
    readMapSize,
    remove: (key) => storage.deleteObject(key),
    removeScene: (sceneId) => storage.deletePrefix(arenaMapPrefix(sceneId)),
    removeToken: (tokenId) => storage.deletePrefix(arenaTokenPrefix(tokenId)),
  };
}

export const arenaImages = createArenaImageStore(mediaStorage);
