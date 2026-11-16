import type { IArenaBounds, IArenaPoint, IArenaToken } from "@magista/shared";
import type { RefObject } from "react";

import type { IArenaStageControls } from "@/modules/arena/arena.types";
import type { IArenaTokenMenuItem } from "@/modules/arena/components/molecules";

export interface UseArenaTokenActionsProps {
  isGm: boolean;
  /** Scene on screen (the live one or the GM preview). */
  sceneId: string | null;
  selectedTokens: IArenaToken[];
  /** Token ids of the current selection (a right click outside it selects the clicked token first). */
  selectedTokenIds: string[];
  controlsRef: RefObject<IArenaStageControls | null>;
  boundsRef: RefObject<IArenaBounds>;
  allHidden: boolean;
  canOpenSheet: boolean;
  /** The viewer may remove the whole selection (the GM always; a player, only tokens they control). */
  canRemove: boolean;
  onApplyChange: (anchor: IArenaPoint) => void;
  onConfigure: () => void;
  onToggleHidden: () => void;
  onOpenSheet: () => void;
  onRemove: () => void;
  onAnnounce: (message: string) => void;
  onError: (message: string | null) => void;
}

export interface IArenaTokenMenuState {
  anchor: IArenaPoint;
  /** Map point of the right click (where "Colar aqui" pastes), or null outside the map. */
  world: IArenaPoint | null;
  /** Opened on a token (its actions) or on the empty map (only pasting). */
  onToken: boolean;
}

export interface IArenaTokenActions {
  menu: { label: string; anchor: IArenaPoint; items: IArenaTokenMenuItem[] } | null;
  /** Right click on a token (or on the map, with null) at a page point. */
  openMenu: (tokenId: string | null, client: IArenaPoint) => void;
  closeMenu: () => void;
  /** Ctrl+C: copies the selection (GM); false when there was nothing to copy. */
  copySelection: () => boolean;
  /** Ctrl+V: pastes the copied tokens under the mouse (or next to the originals); false when nothing is copied. */
  paste: (at?: IArenaPoint | null) => boolean;
}
