import type {
  IArenaBounds,
  IArenaPoint,
  IMoveArenaTokenInput,
  IWorldFogStroke,
} from "@magista/shared";
import type { KeyboardEvent, RefObject } from "react";

import type {
  ArenaSelectionMode,
  IArenaSizeUpdate,
  IArenaStageControls,
} from "@/modules/arena/arena.types";
import type {
  IArenaRenderScene,
  IArenaRenderToken,
  IArenaWorldBrush,
} from "@/modules/arena/services/arenaRenderer";

export interface ArenaStageHookProps {
  scene: IArenaRenderScene | null;
  tokens: IArenaRenderToken[];
  selectedTokenIds: string[];
  /** Token whose turn it is (it floats with a soft aura), or null. */
  turnTokenId: string | null;
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
  /** The world map fog (null off the world map) and how strongly it shows over the map. */
  worldFog: Uint8Array | null;
  fogAlpha: number;
  /** The fog brush (GM painting the world map), or null. */
  brush: IArenaWorldBrush | null;
  onFogStroke: (stroke: IWorldFogStroke) => void;
  /** Scene switches fly through the clouds (the players; the GM switches at once). */
  passages: boolean;
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
