export interface CharacterLibrarySkeletonProps {
  known?: boolean;
  gm?: boolean;
  /** `sidebar` drops the panel frame and the title, like `CharacterLibrary variant="sidebar"`. */
  variant?: "page" | "sidebar";
  /** A player's rows show the menu button ("Colocar no mapa" in the Arena with a live scene). */
  rowActions?: boolean;
}
