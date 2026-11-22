export interface UseArenaWorldProps {
  isGm: boolean;
  onAnnounce: (message: string) => void;
  onError: (message: string | null) => void;
  /** Refetches the Arena (after a refused change, so the screen matches the server again). */
  onReload: () => void;
}
