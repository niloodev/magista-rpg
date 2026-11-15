import type { IArenaBounds, IArenaPoint, IMoveArenaTokenInput } from "@magista/shared";

import type { ArenaSelectionMode, IArenaSizeUpdate } from "@/modules/arena/arena.types";

export interface IArenaCamera {
  x: number;
  y: number;
  scale: number;
}

export interface IArenaViewport {
  width: number;
  height: number;
}

/** Parts of the canvas covered by the HUD (top bar and side panels), in CSS pixels. */
export interface IArenaInsets {
  top: number;
  left: number;
  right: number;
}

export type ArenaTokenTone = "own" | "other";

/** A token as the renderer draws it (positions in pixels of the original map). */
export interface IArenaRenderToken {
  id: string;
  name: string;
  imageUrl: string | null;
  x: number;
  y: number;
  size: number;
  hidden: boolean;
  controllable: boolean;
  tone: ArenaTokenTone;
}

export interface IArenaRenderScene {
  id: string;
  mapUrl: string | null;
}

export interface IArenaRendererCallbacks {
  onSelect: (tokenIds: string[], mode: ArenaSelectionMode) => void;
  onDragMove: (moves: IMoveArenaTokenInput[]) => void;
  onDrop: (moves: IMoveArenaTokenInput[]) => void;
  onResize: (updates: IArenaSizeUpdate[]) => void;
  onSceneReady: (bounds: IArenaBounds) => void;
  onMapError: (failed: boolean) => void;
}

export interface IArenaRendererOptions {
  lite: boolean;
  /** Height covered by the top bar, left out when fitting or centering. */
  insetTop: number;
  /** Height kept free at the bottom when fitting (selection bar, tray and zoom). */
  insetBottom: number;
  fontFamily: string;
  callbacks: IArenaRendererCallbacks;
}

export interface IArenaRenderer {
  setScene: (scene: IArenaRenderScene | null) => Promise<void>;
  setTokens: (tokens: IArenaRenderToken[]) => void;
  setSelection: (tokenIds: string[]) => void;
  setResizable: (resizable: boolean) => void;
  /** Widths covered by the side panels, left out when fitting or centering. */
  setSideInsets: (left: number, right: number) => void;
  zoomBy: (factor: number) => void;
  fitToMap: () => void;
  centerOn: (tokenId: string) => void;
  /** Map point under a page point, or null when it falls outside the visible map area (under a panel or a control). */
  clientToWorld: (clientX: number, clientY: number) => IArenaPoint | null;
  /** Map point at the center of the visible area (between the panels, below the top bar). */
  visibleCenter: () => IArenaPoint;
  retryMap: () => void;
  destroy: () => void;
}

export interface ILoadedTexture<T> {
  texture: T;
  width: number;
  height: number;
}
