import type { IArenaBounds, ICharacterSummary } from "@magista/shared";
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
  submitNpc: (name: string, file: File | null) => Promise<string | null>;
}

export type ArenaPlacementResult = { ok: true; tokenId: string } | { ok: false; error: string };
