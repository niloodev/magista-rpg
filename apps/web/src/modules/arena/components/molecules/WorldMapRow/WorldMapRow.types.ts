export interface WorldMapRowProps {
  /** The world map is live for the table. */
  live: boolean;
  /** The GM is looking at the world map now. */
  viewing: boolean;
  /** Live with a scene kept to return to. */
  canReturn: boolean;
  onPreview: () => void;
  onGoLive: () => void;
  onReturn: () => void;
  /** Inert copy for the skeleton (no menu, no click). */
  inert?: boolean;
}

export type WorldMapRowHookProps = Pick<
  WorldMapRowProps,
  "live" | "canReturn" | "onPreview" | "onGoLive" | "onReturn"
>;
