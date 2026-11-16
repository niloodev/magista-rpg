import type { IArenaBounds, IArenaPoint, IMoveArenaTokenInput } from "@magista/shared";
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
  onDrop: (moves: IMoveArenaTokenInput[]) => void;
  onResize: (updates: IArenaSizeUpdate[]) => void;
  resizable: boolean;
  insetRight: number;
  insetLeft: number;
  onBounds: (bounds: IArenaBounds) => void;
  onMapError: (failed: boolean) => void;
  onTokenMenu: (tokenId: string | null, client: IArenaPoint) => void;
}

export interface ArenaStageProps extends ArenaStageHookProps {
  label: string;
  /** Image files dropped from the computer at a page point (GM with a scene open). */
  onDropFiles?: (files: File[], point: { x: number; y: number }) => void;
  /** A sheet row of a player's list dropped at a page point. */
  onDropCharacterId?: (characterId: string, point: { x: number; y: number }) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  className?: string;
}
