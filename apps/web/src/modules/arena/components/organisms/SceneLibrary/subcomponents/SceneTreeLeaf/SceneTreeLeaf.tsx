"use client";

import { memo } from "react";

import { SCENE_TEXTS } from "@/modules/arena/arena.constants";
import { SceneRow } from "@/modules/arena/components/molecules";
import { ActionMenu } from "@/shared/components/molecules";

import { useSceneTreeLeaf } from "./SceneTreeLeaf.hook";
import type { SceneTreeLeafProps } from "./SceneTreeLeaf.types";

export const SceneTreeLeaf = memo(function SceneTreeLeaf({
  scene,
  slots,
  live,
  viewing,
  onDialog,
  onPreview,
  onGoLive,
}: SceneTreeLeafProps) {
  const { hasMap, thumbUrl, open, menu } = useSceneTreeLeaf({
    scene,
    live,
    onDialog,
    onPreview,
    onGoLive,
  });
  return (
    <SceneRow
      name={scene.name}
      hasMap={hasMap}
      thumbUrl={thumbUrl}
      live={live}
      viewing={viewing}
      onOpen={open}
      handle={slots.handle}
      dropPosition={slots.dropPosition}
      dimmed={slots.dimmed}
      actions={<ActionMenu label={SCENE_TEXTS.sceneActions(scene.name)} items={menu} />}
    />
  );
});
