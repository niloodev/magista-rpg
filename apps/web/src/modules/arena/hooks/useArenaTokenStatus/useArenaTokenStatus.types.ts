import type {
  ArenaEffectStyle,
  IAccount,
  IArenaPoint,
  IArenaToken,
  IArenaTokenStatus,
  IArenaTokenStatusAccess,
  IUpdateArenaTokenInput,
} from "@magista/shared";
import type { RefObject } from "react";

import type {
  ArenaTokenImageChange,
  IArenaAttackerOption,
  IArenaChangeMenuState,
  IArenaChangePreference,
  IArenaStageControls,
} from "@/modules/arena/arena.types";
import type { LoadStatus } from "@/shared/types";

export interface UseArenaTokenStatusProps {
  isGm: boolean;
  controlsRef: RefObject<IArenaStageControls | null>;
  onAnnounce: (message: string) => void;
}

/** What the token settings dialog edits. */
export interface IArenaTokenSettingsTarget {
  token: IArenaToken;
  status: IArenaTokenStatus | null;
  access: IArenaTokenStatusAccess;
  /** Logins of the accounts with access to the token sheet (they always see it). */
  sheetLogins: string[];
}

export interface IArenaTokenStatusControls {
  changeMenu: IArenaChangeMenuState | null;
  /** Action, attribute, animation and last amount of the menu. */
  changePreference: IArenaChangePreference;
  updateChange: (patch: Partial<Omit<IArenaChangePreference, "amount">>) => void;
  /** Name of the animation set ("Automático (Golpe)", "Fissura"). */
  effectLabel: string;
  /** What "Automático" plays now: the attacking sheet's animation, else the action default. */
  autoStyle: ArenaEffectStyle;
  /** Keeps the animation chosen in the picker and closes it. */
  chooseEffect: (choice: IArenaChangePreference["effect"]) => void;
  effectPickerOpen: boolean;
  openEffectPicker: () => void;
  closeEffectPicker: () => void;
  changeError: string | null;
  changePending: boolean;
  /** Opens "Aplicar mudança" for a token (right click) or for the selection (keyboard, selection bar). */
  openChangeMenu: (tokenId: string | null, anchor: IArenaPoint | null) => void;
  closeChangeMenu: () => void;
  /** Applies the change set in the menu with this amount; resolves true when the menu may close. */
  applyChange: (amount: number) => Promise<boolean>;
  /** Tokens that may deal the change (the player's own, every other token for the GM). */
  attackerOptions: IArenaAttackerOption[];
  /** Chosen attacker ("" for none). */
  attackerId: string;
  setAttackerId: (tokenId: string) => void;
  /** Status of the single selected token, when visible, and its text for screen readers. */
  selectionStatus: { status: IArenaTokenStatus; label: string } | null;
  settings: IArenaTokenSettingsTarget | null;
  openSettings: () => void;
  closeSettings: () => void;
  accounts: IAccount[];
  accountsStatus: LoadStatus;
  retryAccounts: () => void;
  /** Saves the settings, then swaps or removes the NPC image; resolves to an error message or null. */
  saveSettings: (
    input: IUpdateArenaTokenInput,
    image: ArenaTokenImageChange,
  ) => Promise<string | null>;
}
