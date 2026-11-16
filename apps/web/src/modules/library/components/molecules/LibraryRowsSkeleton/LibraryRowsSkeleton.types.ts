import type { ILibraryShape } from "@/modules/library/library.types";

export interface LibraryRowsSkeletonProps {
  shape: ILibraryShape;
  tree?: boolean;
  announce?: boolean;
  /** The flat rows show their menu button (a player's rows in the Arena, with "Colocar no mapa"). */
  rowActions?: boolean;
}
