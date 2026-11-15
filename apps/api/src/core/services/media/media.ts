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

import { getEnv } from "@/core/services/env";

import type {
  IArenaImageStore,
  ICharacterImageStore,
  IImageType,
  IMediaStorage,
} from "./media.types";
import {
  arenaMapKeyFor,
  arenaMapPrefix,
  arenaTokenKeyFor,
  arenaTokenPrefix,
  characterMediaPrefix,
  detectImageType,
  mediaKeyFor,
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
    store: async (characterId, kind, body) => {
      const type = detectImageType(body);
      if (!type) return null;
      const key = mediaKeyFor(characterId, kind, type);
      await storage.putObject(key, body, type.contentType);
      return key;
    },
    remove: (key) => storage.deleteObject(key),
    removeAll: (characterId) => storage.deletePrefix(characterMediaPrefix(characterId)),
  };
}

export const characterImages = createCharacterImageStore(mediaStorage);

/**
 * Arena images (scene maps and NPC token images) on top of the object storage, validated by file signature.
 */
export function createArenaImageStore(storage: IMediaStorage): IArenaImageStore {
  const store = async (body: Buffer, keyFor: (type: IImageType) => string) => {
    const type = detectImageType(body);
    if (!type) return null;
    const key = keyFor(type);
    await storage.putObject(key, body, type.contentType);
    return key;
  };
  return {
    sizeOf: readImageSize,
    storeMap: (sceneId, body) => store(body, (type) => arenaMapKeyFor(sceneId, type)),
    storeToken: (tokenId, body) => store(body, (type) => arenaTokenKeyFor(tokenId, type)),
    remove: (key) => storage.deleteObject(key),
    removeScene: (sceneId) => storage.deletePrefix(arenaMapPrefix(sceneId)),
    removeToken: (tokenId) => storage.deletePrefix(arenaTokenPrefix(tokenId)),
  };
}

export const arenaImages = createArenaImageStore(mediaStorage);
