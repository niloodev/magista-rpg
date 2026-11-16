import type { ArenaChangeKind, ArenaEffectStyle, ArenaResourceKey } from "@magista/shared";

export interface IArenaEffectPreviewOptions {
  fontFamily: string;
  lite: boolean;
}

/** What the preview loops: the animation and the change it stands for (sign and color of the amount). */
export interface IArenaEffectPreviewPlay {
  style: ArenaEffectStyle;
  kind: ArenaChangeKind;
  resource: ArenaResourceKey;
  /** Shows the attacker's part too. */
  withAttacker: boolean;
}
