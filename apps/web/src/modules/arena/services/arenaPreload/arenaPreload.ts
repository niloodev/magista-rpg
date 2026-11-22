import { preload } from "react-dom";

import { versionedUrl } from "@/core/services/version";
import { ARENA_ASSETS } from "@/modules/arena/arena.constants";

/**
 * Asks the browser for the static assets of the Arena (the world map, the largest image, fixed in the app) early
 * and with high priority. They are hinted as fetches, because the asset loader downloads them with `fetch` (to
 * count the bytes on the loading screen) and the browser hands it the preloaded response. Works from the route
 * (server) and on client navigation.
 */
export function preloadArenaAssets(): void {
  for (const asset of ARENA_ASSETS) {
    preload(versionedUrl(asset.url), {
      as: "fetch",
      crossOrigin: "anonymous",
      fetchPriority: "high",
    });
  }
}
