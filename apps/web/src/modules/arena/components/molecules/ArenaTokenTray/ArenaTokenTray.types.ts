export interface IArenaTrayToken {
  id: string;
  name: string;
  imageUrl: string | null;
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
