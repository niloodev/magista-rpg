/** A stored image shared by every scene, sheet or token that uses the same bytes. */
export interface IMediaAsset {
  id: string;
  hash: string;
  key: string;
  thumbKey: string | null;
  width: number;
  height: number;
  bytes: number;
  contentType: string;
}

export interface IMediaAssetModels {
  findByKey: (key: string) => Promise<IMediaAsset | null>;
  /** Creates the row; returns null when another upload of the same bytes won the race. */
  create: (asset: IMediaAsset) => Promise<IMediaAsset | null>;
  /** How many scenes, sheets and tokens point to this key. */
  countReferences: (key: string) => Promise<number>;
  /**
   * The asset of these bytes, marked as just linked in the same statement (so a release running at the same time
   * either deletes it first, and this returns null, or sees the fresh link and keeps it).
   */
  linkByHash: (hash: string) => Promise<IMediaAsset | null>;
  /**
   * Deletes the asset row in one statement only when nothing points to it and no upload linked it in the last
   * minutes; true when it was deleted (then its files can go).
   */
  removeIfUnused: (id: string, key: string) => Promise<boolean>;
  /** Assets nothing points to and no upload linked recently (left by cascaded deletes or failed saves). */
  listUnreferenced: () => Promise<IMediaAsset[]>;
  /** Image keys still stored outside the assets (written before they existed), each listed once. */
  listLegacyKeys: () => Promise<string[]>;
  /** Points every scene, sheet and token using `from` to `to`. */
  replaceKey: (from: string, to: string) => Promise<void>;
}
