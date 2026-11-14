import type { RefObject } from "react";

export interface LibraryToolbarProps {
  isGm: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  resultLabel: string;
  onNewFolder: () => void;
  onNewCharacter: () => void;
  onAccounts: () => void;
}
