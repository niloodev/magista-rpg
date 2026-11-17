import type { ArenaChangeKind } from "@magista/shared";
import type { Container } from "pixi.js";

/** What the spell does on the whole screen (once per cast). */
export interface IDivineScreen {
  step: (t: number, origin: Container, r: number) => void;
  /**
   * After the spell, its fluid keeps flowing with no new ink and fades by itself; `since` is how long it has been
   * over, in milliseconds. False once it is gone.
   */
  linger: (origin: Container, r: number, since: number) => boolean;
  end: () => void;
}

/** A healing call is a blessing, a damaging one a judgment. */
export type DivineMood = ArenaChangeKind;
