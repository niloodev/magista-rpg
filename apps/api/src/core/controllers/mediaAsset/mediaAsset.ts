import { randomUUID } from "node:crypto";

import { mediaAssetModels } from "@/core/models/mediaAsset";
import { assetFiles, assetIdOf, hashImage, readImageSize } from "@/core/services/media";

import type { IImageAssets, IImageAssetsDeps } from "./mediaAsset.types";

/**
 * Shared image assets: one stored copy per distinct image (by content hash), with an optimized version and a
 * thumbnail, linked by key from scenes, sheets and tokens, and deleted when the last link goes away.
 */
export function createImageAssets({
  assets,
  files,
  readSize,
  hash,
  newId,
}: IImageAssetsDeps): IImageAssets {
  const ingest: IImageAssets["ingest"] = async (body) => {
    const size = readSize(body);
    if (!size) return null;
    const contentHash = hash(body);
    const existing = await assets.linkByHash(contentHash);
    if (existing) return { key: existing.key, width: existing.width, height: existing.height };
    const id = newId();
    const stored = await files.put(id, body);
    if (!stored) return null;
    const created = await assets
      .create({ id, hash: contentHash, ...stored, ...size })
      .catch(async (error: unknown) => {
        await files.remove(id);
        throw error;
      });
    if (created) return { key: created.key, width: created.width, height: created.height };
    await files.remove(id);
    const winner = await assets.linkByHash(contentHash);
    return winner ? { key: winner.key, width: winner.width, height: winner.height } : null;
  };

  const release: IImageAssets["release"] = async (key) => {
    if (!key) return;
    const assetId = assetIdOf(key);
    if (!assetId) {
      if ((await assets.countReferences(key)) === 0) await files.removeKey(key);
      return;
    }
    if (await assets.removeIfUnused(assetId, key)) await files.remove(assetId);
  };

  const adoptLegacy: IImageAssets["adoptLegacy"] = async (report) => {
    let moved = 0;
    let failed = 0;
    for (const legacyKey of await assets.listLegacyKeys()) {
      try {
        const body = await files.readOriginal(legacyKey);
        const stored = body ? await ingest(body) : null;
        if (!stored) {
          failed += 1;
          report(`x ${legacyKey}: imagem não encontrada ou inválida`);
          continue;
        }
        await assets.replaceKey(legacyKey, stored.key);
        await files.removeKey(legacyKey);
        moved += 1;
        report(`+ ${legacyKey} -> ${stored.key}`);
      } catch (error) {
        failed += 1;
        report(`x ${legacyKey}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return { moved, failed };
  };

  const sweep: IImageAssets["sweep"] = async () => {
    const unused = await assets.listUnreferenced();
    let removed = 0;
    for (const asset of unused) {
      if (!(await assets.removeIfUnused(asset.id, asset.key))) continue;
      await files.remove(asset.id);
      removed += 1;
    }
    return removed;
  };

  return { ingest, release, adoptLegacy, sweep };
}

export const imageAssets = createImageAssets({
  assets: mediaAssetModels,
  files: assetFiles,
  readSize: readImageSize,
  hash: hashImage,
  newId: randomUUID,
});
