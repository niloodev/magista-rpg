import type { IArenaBounds, IMoveArenaTokenInput } from "@magista/shared";
import type { KeyboardEvent, RefObject } from "react";

import type {
  ArenaSelectionMode,
  IArenaSizeUpdate,
  IArenaStageControls,
} from "@/modules/arena/arena.types";
import type { IArenaRenderScene, IArenaRenderToken } from "@/modules/arena/services/arenaRenderer";

export interface ArenaStageHookProps {
  scene: IArenaRenderScene | null;
  tokens: IArenaRenderToken[];
  selectedTokenIds: string[];
  controlsRef: RefObject<IArenaStageControls | null>;
  onSelect: (tokenIds: string[], mode: ArenaSelectionMode) => void;
  onDragMove: (moves: IMoveArenaTokenInput[]) => void;
  onDrop: (moves: IMoveArenaTokenInput[]) => void;
  onResize: (updates: IArenaSizeUpdate[]) => void;
  resizable: boolean;
  onBounds: (bounds: IArenaBounds) => void;
  onMapError: (failed: boolean) => void;
}

export interface ArenaStageProps extends ArenaStageHookProps {
  label: string;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  className?: string;
}
