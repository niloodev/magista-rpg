import type { IArenaBounds, IArenaPoint, ICharacterSummary, TokenStyle } from "@magista/shared";
import type { RefObject } from "react";

import type { IArenaStageControls } from "@/modules/arena/arena.types";

export interface UseArenaTokenPlacementProps {
  /** Scene on the GM screen (the live one or the preview); null when there is none. */
  sceneId: string | null;
  enabled: boolean;
  controlsRef: RefObject<IArenaStageControls | null>;
  boundsRef: RefObject<IArenaBounds>;
  onError: (message: string) => void;
}

export interface IArenaTokenPlacement {
  placeCharacter: (character: ICharacterSummary) => void;
  dropCharacter: (character: ICharacterSummary, point: { x: number; y: number }) => void;
  npcDialogOpen: boolean;
  openNpcDialog: () => void;
  closeNpcDialog: () => void;
  /** Creates the NPC token at the center of the view; resolves to an error message or null. */
  submitNpc: (name: string, file: File | null, style: TokenStyle) => Promise<string | null>;
  /** Image files dropped on the map, waiting for the style question (null when none). */
  imageDropFiles: File[] | null;
  /** Image files dropped from the computer at a page point (ignored outside the map). */
  dropImages: (files: File[], point: { x: number; y: number }) => void;
  /** Creates one NPC token per dropped image with the chosen names and style. */
  submitImageDrop: (names: string[], style: TokenStyle) => Promise<string | null>;
  closeImageDrop: () => void;
}

export type ArenaPlacementResult = { ok: true; tokenId: string } | { ok: false; error: string };

/** Images dropped on the map and the map point where they fell. */
export interface IArenaImageDrop {
  files: File[];
  point: IArenaPoint;
}
