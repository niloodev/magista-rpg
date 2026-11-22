import type { IAsset, IAssetBytes, IAssetProgress } from "./assets.types";

/**
 * The progress of a set of assets from the bytes of each: by bytes when every size is known, otherwise by how many
 * assets finished (an asset of unknown size counts as half done while it loads).
 */
export function assetProgress(
  assets: readonly IAsset[],
  bytes: ReadonlyMap<string, IAssetBytes>,
  finished: ReadonlySet<string>,
): IAssetProgress {
  const done = assets.every((asset) => finished.has(asset.url));
  const current = assets.find((asset) => !finished.has(asset.url))?.label ?? null;
  let loadedBytes = 0;
  let totalBytes = 0;
  let sized = true;
  for (const asset of assets) {
    const entry = bytes.get(asset.url);
    loadedBytes += entry?.loaded ?? 0;
    totalBytes += entry?.total ?? 0;
    if (!entry?.total && !finished.has(asset.url)) sized = false;
  }
  if (assets.length === 0 || done) {
    return { ratio: 1, loadedBytes, totalBytes, current: null, done: true };
  }
  const ratio = sized
    ? Math.min(loadedBytes / Math.max(totalBytes, 1), 1)
    : assets.reduce(
        (sum, asset) => sum + (finished.has(asset.url) ? 1 : bytes.has(asset.url) ? 0.5 : 0),
        0,
      ) / assets.length;
  return { ratio, loadedBytes, totalBytes, current, done: false };
}

/** A size in megabytes for the loading screen ("2,4 MB"). */
export function formatMegabytes(bytes: number): string {
  return `${(bytes / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} MB`;
}

/** Runs `task` on every item in order, never more than `limit` at the same time. */
export async function runPooled<T>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++] as T;
      await task(item);
    }
  };
  const workers = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workers }, worker));
}
