import { useCallback, useMemo } from "react";

import { toMediaUrl } from "@/core/services/http";

import { sceneMenu } from "../../SceneLibrary.utils";
import type { SceneTreeLeafProps } from "./SceneTreeLeaf.types";

/**
 * Row data of a scene in the GM tree: thumbnail, open handler and actions menu.
 */
export function useSceneTreeLeaf({
  scene,
  live,
  onDialog,
  onPreview,
  onGoLive,
}: Omit<SceneTreeLeafProps, "slots" | "viewing">) {
  const open = useCallback(() => onPreview(scene.id), [onPreview, scene.id]);
  const menu = useMemo(
    () => sceneMenu(scene, live, { open: onDialog, preview: onPreview, goLive: onGoLive }),
    [scene, live, onDialog, onPreview, onGoLive],
  );
  return { hasMap: scene.mapUrl !== null, thumbUrl: toMediaUrl(scene.mapThumbUrl), open, menu };
}
