import { versionedUrl } from "@/core/services/version";

import type { IAsset, IAssetBytes, IAssetProgress } from "./assets.types";
import { assetProgress, runPooled } from "./assets.utils";

const loaded = new Map<string, Promise<Blob>>();

const listeners = new Map<string, Set<(bytes: IAssetBytes) => void>>();

const latest = new Map<string, IAssetBytes>();

function notify(url: string, bytes: IAssetBytes): void {
  latest.set(url, bytes);
  for (const listener of listeners.get(url) ?? []) listener(bytes);
}

async function download(url: string): Promise<Blob> {
  const onBytes = (bytes: IAssetBytes) => notify(url, bytes);
  const response = await fetch(versionedUrl(url), { credentials: "same-origin" });
  if (!response.ok) throw new Error(`Falha ao carregar ${url}: ${response.status}`);
  const total = Number(response.headers.get("content-length")) || 0;
  const type = response.headers.get("content-type") ?? "";
  if (!response.body) {
    const blob = await response.blob();
    onBytes({ loaded: blob.size, total: blob.size });
    return blob;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  onBytes({ loaded: 0, total });
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    onBytes({ loaded: received, total: Math.max(total, received) });
  }
  return new Blob(chunks as BlobPart[], { type });
}

/**
 * The bytes of a static asset of the app, downloaded once per tab (later calls share the same download and its
 * progress, so the loading screen and the screen that uses the asset never fetch it twice). A failed download is
 * forgotten, so the next call tries again.
 */
export function loadAsset(url: string, onBytes?: (bytes: IAssetBytes) => void): Promise<Blob> {
  if (onBytes) {
    const set = listeners.get(url) ?? new Set();
    set.add(onBytes);
    listeners.set(url, set);
    const known = latest.get(url);
    if (known) onBytes(known);
  }
  let pending = loaded.get(url);
  if (!pending) {
    pending = download(url).catch((error: unknown) => {
      loaded.delete(url);
      latest.delete(url);
      throw error;
    });
    loaded.set(url, pending);
  }
  const forget = () => {
    if (onBytes) listeners.get(url)?.delete(onBytes);
  };
  pending.then(forget, forget);
  return pending;
}

const warmed = new Map<string, Promise<void>>();

async function warm(url: string, onBytes: (bytes: IAssetBytes) => void): Promise<void> {
  const response = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!response.ok) throw new Error(`Falha ao carregar ${url}: ${response.status}`);
  const total = Number(response.headers.get("content-length")) || 0;
  if (!response.body) {
    const size = (await response.arrayBuffer()).byteLength;
    onBytes({ loaded: size, total: size });
    return;
  }
  const reader = response.body.getReader();
  let received = 0;
  onBytes({ loaded: 0, total });
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    onBytes({ loaded: received, total: Math.max(total, received) });
  }
}

/**
 * Puts a media file (an absolute URL, as `toMediaUrl` gives) in the browser cache without keeping its bytes here:
 * the screen that shows it later gets it from the cache at once. Once per tab.
 */
export function warmAsset(url: string, onBytes: (bytes: IAssetBytes) => void): Promise<void> {
  let pending = warmed.get(url);
  if (!pending) {
    pending = warm(url, onBytes).catch((error: unknown) => {
      warmed.delete(url);
      throw error;
    });
    warmed.set(url, pending);
  }
  return pending;
}

/**
 * Loads a set of assets in their order, at most `concurrency` at a time (the first ones, the most needed, never
 * wait behind the rest), reporting the progress as the bytes arrive. Resolves when all are in (an asset that fails
 * still counts as finished, so a broken file never holds a screen forever; the screen that needs it shows its own
 * error).
 */
export async function preloadAssets(
  assets: readonly IAsset[],
  onProgress: (progress: IAssetProgress) => void,
  concurrency = Number.POSITIVE_INFINITY,
): Promise<void> {
  const bytes = new Map<string, IAssetBytes>();
  const finished = new Set<string>();
  const report = () => onProgress(assetProgress(assets, bytes, finished));
  report();
  await runPooled(assets, concurrency, async (asset) => {
    const track = (entry: IAssetBytes) => {
      bytes.set(asset.url, entry);
      report();
    };
    try {
      if (asset.keep === false) {
        await warmAsset(asset.url, track);
      } else {
        const blob = await loadAsset(asset.url, track);
        bytes.set(asset.url, { loaded: blob.size, total: blob.size });
      }
    } catch {
      bytes.delete(asset.url);
    }
    finished.add(asset.url);
    report();
  });
}
