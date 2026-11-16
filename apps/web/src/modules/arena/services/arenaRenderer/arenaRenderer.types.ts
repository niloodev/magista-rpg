import type {
  IArenaBounds,
  IArenaEffect,
  IArenaPoint,
  IArenaTokenStatus,
  IMoveArenaTokenInput,
} from "@magista/shared";

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
  /** Health and sanity, when the viewer may see them (bars above the token). */
  status: IArenaTokenStatus | null;
}

export interface IArenaRenderScene {
  id: string;
  mapUrl: string | null;
  /** Board size in world pixels; the map image is stretched to it. */
  width: number;
  height: number;
}

export interface IArenaRendererCallbacks {
  onSelect: (tokenIds: string[], mode: ArenaSelectionMode) => void;
  onDrop: (moves: IMoveArenaTokenInput[]) => void;
  onResize: (updates: IArenaSizeUpdate[]) => void;
  onSceneReady: (bounds: IArenaBounds) => void;
  onMapError: (failed: boolean) => void;
  /** Right click without dragging on a token (opens "Aplicar mudança" at that page point). */
  onTokenMenu: (tokenId: string, client: IArenaPoint) => void;
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
  /** Current camera zoom (screen pixels per map pixel). */
  zoom: () => number;
  /** Map point at the center of the visible area (between the panels, below the top bar). */
  visibleCenter: () => IArenaPoint;
  retryMap: () => void;
  /** Plays damage and healing animations on the tokens they hit. */
  playEffects: (effects: IArenaEffect[]) => void;
  destroy: () => void;
}

export interface ILoadedTexture<T> {
  texture: T;
  width: number;
  height: number;
}
