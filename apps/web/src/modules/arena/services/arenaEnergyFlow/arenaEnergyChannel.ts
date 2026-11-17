import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

import { ArenaEnergyFlow } from "./arenaEnergyFlow";
import type { IEnergyChannelOptions, IEnergyFlowFrame } from "./arenaEnergyFlow.types";
import { channelPath } from "./arenaEnergyFlow.utils";

/** Points the channel's curve is drawn with. */
const CHANNEL_POINTS = 40;

/**
 * A channel of flowing energy between two points: one long ribbon of `ArenaEnergyFlow` along a smooth curve that
 * bows and slowly sways, with the energy running from `from` to `to`; show it reaching out with `head` and
 * draining away with `tail`. The endpoints can move (`moveTo`).
 */
export class ArenaEnergyChannel {
  private readonly flow: ArenaEnergyFlow;
  private from: IArenaPoint2;
  private to: IArenaPoint2;

  constructor(private readonly options: IEnergyChannelOptions) {
    this.flow = new ArenaEnergyFlow({
      ...options,
      samples: options.samples ?? CHANNEL_POINTS,
      feather: options.feather ?? 1,
    });
    this.from = options.from;
    this.to = options.to;
  }

  get mesh(): ArenaEnergyFlow["mesh"] {
    return this.flow.mesh;
  }

  moveTo(from: IArenaPoint2, to: IArenaPoint2): void {
    this.from = from;
    this.to = to;
  }

  /** Sways the curve to `seconds`, runs its energy and shows it from `tail` to `head`. */
  update(seconds: number, frame: IEnergyFlowFrame = {}): void {
    const alpha = frame.alpha ?? 1;
    const head = frame.head ?? 1;
    if (alpha <= 0 || head <= (frame.tail ?? 0)) {
      this.flow.update(seconds, frame);
      return;
    }
    const {
      bend,
      counter = -bend * 0.5,
      sway = 0.08,
      swaySpeed = 0.9,
      width,
      seed = 0,
    } = this.options;
    const wave = Math.sin(seconds * swaySpeed + seed);
    const path = channelPath(
      this.from,
      this.to,
      bend + sway * wave,
      counter - sway * 0.7 * wave,
      CHANNEL_POINTS,
    );
    this.flow.setPath(
      path,
      (along) => width * 1.5 * (0.3 + 0.7 * Math.sin(Math.PI * along) ** 0.5),
    );
    this.flow.update(seconds, frame);
  }

  destroy(): void {
    this.flow.destroy();
  }
}
