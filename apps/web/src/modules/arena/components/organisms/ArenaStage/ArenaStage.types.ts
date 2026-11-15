import type { IArenaBounds, IArenaPoint } from "@magista/shared";
import type { KeyboardEvent, RefObject } from "react";

import type { IArenaStageControls } from "@/modules/arena/arena.types";
import type { IArenaRenderScene, IArenaRenderToken } from "@/modules/arena/services/arenaRenderer";

export interface ArenaStageHookProps {
  scene: IArenaRenderScene | null;
  tokens: IArenaRenderToken[];
  selectedTokenId: string | null;
  controlsRef: RefObject<IArenaStageControls | null>;
  onSelect: (tokenId: string | null) => void;
  onDragMove: (tokenId: string, point: IArenaPoint) => void;
  onDrop: (tokenId: string, point: IArenaPoint) => void;
  onBounds: (bounds: IArenaBounds) => void;
  onMapError: (failed: boolean) => void;
}

export interface ArenaStageProps extends ArenaStageHookProps {
  label: string;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  className?: string;
}
