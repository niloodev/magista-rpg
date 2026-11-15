export type CharacterLibraryVariant = "page" | "sidebar";

export interface CharacterLibraryProps {
  className?: string;
  /** "sidebar" drops the section header and the panel frame (the Arena sidebar already has both). */
  variant?: CharacterLibraryVariant;
  /** Opens a sheet without leaving the page (Arena); rows link to the sheet page otherwise. */
  onOpenCharacter?: (characterId: string) => void;
}
