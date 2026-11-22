import type { IArenaFxHost } from "@/modules/arena/services/arenaTokenEffects";

export interface IArenaPartyTokenOptions {
  host: IArenaFxHost;
  lite: boolean;
  seed: number;
  /** The colors it cycles through (one per player). */
  colors: readonly number[];
}

/** What the party token did this frame: keep drawing, or (light mode) when its next color change is due. */
export interface IArenaPartyTokenFrame {
  animating: boolean;
  /** Light mode: ms until the color steps again (the loop sleeps until then). */
  wakeInMs: number | null;
}
