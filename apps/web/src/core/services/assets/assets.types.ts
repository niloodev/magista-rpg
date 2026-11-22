/** A static file of the app to load before a screen needs it (an image, a sound). */
export interface IAsset {
  url: string;
  /** What it is, shown on the loading screen ("Mapa Mundi"). */
  label: string;
  /**
   * Keep the bytes in this tab (a file the app reads right away, like the world map). False only warms the
   * browser cache, for media the screens fetch themselves later (the scene maps), so big files never sit in memory.
   */
  keep?: boolean;
}

/** How far a set of assets has loaded. */
export interface IAssetProgress {
  /** 0 to 1. */
  ratio: number;
  loadedBytes: number;
  totalBytes: number;
  /** Label of the asset still loading (null once all are in). */
  current: string | null;
  done: boolean;
}

/** Bytes of one asset so far, and its size when the server tells it (0 when unknown). */
export interface IAssetBytes {
  loaded: number;
  total: number;
}
