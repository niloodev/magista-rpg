import type { IArenaToken } from "@magista/shared";

export interface UseArenaTurnsProps {
  isGm: boolean;
  selectedTokens: IArenaToken[];
  /** Tokens the viewer may move (their own, or every token for the GM). */
  controllableIds: ReadonlySet<string>;
  /** Selects a token and centers the camera on it. */
  onPickToken: (tokenId: string) => void;
  onAnnounce: (message: string) => void;
  onError: (message: string | null) => void;
}
