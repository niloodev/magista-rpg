import type { TokenStyle } from "@magista/shared";

export interface IArenaTrayToken {
  id: string;
  name: string;
  imageUrl: string | null;
  style: TokenStyle;
  tone: "own" | "other";
  hidden: boolean;
}

export interface ArenaTokenTrayProps {
  label: string;
  tokens: IArenaTrayToken[];
  selectedId: string | null;
  onPick: (tokenId: string) => void;
  className?: string;
}
