import type { IMediaAssetModels } from "@/core/models/mediaAsset";
import type { IAssetFileStore } from "@/core/services/media";

export interface IImageAssetsDeps {
  assets: IMediaAssetModels;
  files: IAssetFileStore;
  readSize: (body: Buffer) => { width: number; height: number } | null;
  hash: (body: Buffer) => string;
  newId: () => string;
}

/** A stored image ready to be linked: its key and natural size. */
export interface IIngestedImage {
  key: string;
  width: number;
  height: number;
}

export interface IImageAssets {
  /**
   * Stores an uploaded image once: the same bytes return the asset already stored (no duplicate files), new ones
   * are optimized (WebP) with a thumbnail. Null when the bytes are not a supported image.
   */
  ingest: (body: Buffer) => Promise<IIngestedImage | null>;
  /**
   * Lets go of an image that a scene, sheet or token stopped using: an asset is deleted only when nothing points
   * to it anymore; an older image (stored before assets existed) is deleted right away.
   */
  release: (key: string | null) => Promise<void>;
  /**
   * Moves every image stored before assets existed into an asset (optimized, with a thumbnail, without
   * duplicates) and points what used it to the new key. Reports each image moved or skipped.
   */
  adoptLegacy: (report: (line: string) => void) => Promise<{ moved: number; failed: number }>;
  /** Deletes the assets nothing links to anymore (left by cascaded deletes). Returns how many. */
  sweep: () => Promise<number>;
}
