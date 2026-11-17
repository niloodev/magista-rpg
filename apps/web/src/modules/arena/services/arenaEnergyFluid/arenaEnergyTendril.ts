import { Container } from "pixi.js";

import {
  ArenaEnergyChannel,
  type IEnergyFlowFrame,
} from "@/modules/arena/services/arenaEnergyFlow";
import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

import type { ArenaEnergyFluid } from "./arenaEnergyFluid";
import { TENDRIL_DEFAULTS } from "./arenaEnergyFluid.constants";
import type { IEnergyTendrilOptions } from "./arenaEnergyFluid.types";
import { tendrilThreads } from "./arenaEnergyFluid.utils";

/**
 * A tendril of energy between two points: a few thin threads of light weaving around the same curve, drawn sharp
 * (`view`, for the scene), and a wider unseen stream that pours their ink into a fluid, so the tendril leaves a
 * wake of mist that curls away and fades by itself. Reach out with `head`, drain with `tail`. Destroy it before
 * its fluid.
 */
export class ArenaEnergyTendril {
  readonly view = new Container();
  private readonly threads: ArenaEnergyChannel[];
  private readonly ink: ArenaEnergyChannel;

  constructor(fluid: ArenaEnergyFluid, options: IEnergyTendrilOptions) {
    const count = options.threads ?? TENDRIL_DEFAULTS.threads;
    this.threads = tendrilThreads(options, count).map(
      (thread) =>
        new ArenaEnergyChannel({
          sharpness: TENDRIL_DEFAULTS.sharpness,
          strands: TENDRIL_DEFAULTS.strands,
          ...options,
          ...thread,
        }),
    );
    this.ink = new ArenaEnergyChannel({
      ...options,
      width: options.width * (options.wake ?? TENDRIL_DEFAULTS.wake),
      sharpness: 1,
      strands: 2,
    });
    this.view.eventMode = "none";
    for (const thread of this.threads) this.view.addChild(thread.mesh);
    fluid.sources.addChild(this.ink.mesh);
  }

  moveTo(from: IArenaPoint2, to: IArenaPoint2): void {
    for (const channel of [...this.threads, this.ink]) channel.moveTo(from, to);
  }

  /** Sways and runs the threads to `seconds`, showing them (and pouring their ink) from `tail` to `head`. */
  update(seconds: number, frame: IEnergyFlowFrame = {}): void {
    for (const channel of [...this.threads, this.ink]) channel.update(seconds, frame);
  }

  destroy(): void {
    this.ink.mesh.removeFromParent();
    for (const channel of [...this.threads, this.ink]) channel.destroy();
    this.view.destroy();
  }
}
