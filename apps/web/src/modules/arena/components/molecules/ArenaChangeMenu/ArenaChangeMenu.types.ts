import type { ArenaEffectStyle, IArenaPoint } from "@magista/shared";

import type {
  IArenaAttackerOption,
  IArenaChangePreference,
  IArenaTokenImage,
} from "@/modules/arena/arena.types";

export interface ArenaChangeMenuProps {
  /** Who takes the change ("Goblin" or "3 tokens"). */
  target: string;
  /** Portraits of the first targets, for the header. */
  targetImages: IArenaTokenImage[];
  /** Page point where it opens; null opens it above the selection bar. */
  anchor: IArenaPoint | null;
  /** Action, attribute and animation set, plus the last amount. */
  preference: IArenaChangePreference;
  onPreferenceChange: (patch: Partial<Omit<IArenaChangePreference, "amount">>) => void;
  /** Name of the animation that will play ("Automático (Golpe)" or "Fissura"). */
  effectLabel: string;
  /** The animation "Automático" resolves to (the attacker's sheet preference or the default). */
  autoStyle: ArenaEffectStyle;
  onPickEffect: () => void;
  /** The effect picker is open over it: no closing on outside clicks or Esc. */
  suspended: boolean;
  /** Tokens that may deal the change; empty hides the choice. */
  attackers: IArenaAttackerOption[];
  /** Chosen attacker ("" for none). */
  attackerId: string;
  onAttackerChange: (tokenId: string) => void;
  error: string | null;
  pending: boolean;
  /** Applies the change with this amount; resolves true when it was applied. */
  onApply: (amount: number) => Promise<boolean>;
  onClose: () => void;
}

/** One choice of a segmented control (radio buttons styled as tabs). */
export interface IArenaSegment<T extends string> {
  value: T;
  label: string;
  icon: "swords" | "sparkles" | "heart" | "zap";
}
