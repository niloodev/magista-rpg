import type { ICharacterSummary } from "@magista/shared";

import type { ITreeOutsidePreview } from "@/modules/library/components/organisms/FolderTree";

export type CharacterLibraryVariant = "page" | "sidebar";

export interface CharacterLibraryProps {
  className?: string;
  /** "sidebar" drops the section header and the panel frame (the Arena sidebar already has both). */
  variant?: CharacterLibraryVariant;
  /** Opens a sheet without leaving the page (Arena); rows link to the sheet page otherwise. */
  onOpenCharacter?: (characterId: string) => void;
  /** GM only: "Colocar no mapa" in the sheet menu (Arena). */
  onPlaceCharacter?: (character: ICharacterSummary) => void;
  /** GM only: a sheet dragged out of the tree and released at a page point (Arena map). */
  onDropCharacter?: (character: ICharacterSummary, point: { x: number; y: number }) => void;
  /** What a sheet looks like while dragged over a spot where `onDropCharacter` works (a token on the map). */
  dropPreview?: ITreeOutsidePreview<ICharacterSummary>;
}
