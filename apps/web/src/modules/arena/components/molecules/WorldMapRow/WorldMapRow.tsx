"use client";

import { WORLD_TEXTS } from "@/modules/arena/arena.constants";
import { ActionMenu } from "@/shared/components/molecules";

import { SceneRow } from "../SceneRow";
import { useWorldMapRow } from "./WorldMapRow.hook";
import type { WorldMapRowProps } from "./WorldMapRow.types";

/**
 * The world map in the GM's map library: always first, above the scenes, in the same frame as a scene row (the
 * fixed map of Namor as thumbnail, "Ao vivo" and "Vendo agora"). Clicking it opens the world map for the GM.
 */
export function WorldMapRow({ inert = false, viewing, ...props }: WorldMapRowProps) {
  const { items, thumbUrl } = useWorldMapRow(props);
  return (
    <div inert={inert}>
      <SceneRow
        name={WORLD_TEXTS.name}
        hasMap
        thumbUrl={thumbUrl}
        heading={!inert}
        live={props.live}
        viewing={viewing}
        onOpen={props.onPreview}
        actions={inert ? null : <ActionMenu label={WORLD_TEXTS.menuLabel} items={items} />}
      />
    </div>
  );
}
