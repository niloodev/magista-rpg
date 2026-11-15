import type { ISheetTrait } from "@magista/shared";

export interface MarkedSoulPanelProps {
  characterId: string;
  traits: ISheetTrait[];
  /** Saves pending sheet edits so the server shares the trait as it is on screen. */
  onBeforeShare: () => Promise<void>;
}
