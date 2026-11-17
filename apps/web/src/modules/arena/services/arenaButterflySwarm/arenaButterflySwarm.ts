import { Container } from "pixi.js";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import type { IArenaFxTextureSet } from "@/modules/arena/services/arenaFxTextures";

import {
  BUTTERFLY_BODY,
  BUTTERFLY_FLUTTER,
  BUTTERFLY_WOBBLE,
} from "./arenaButterflySwarm.constants";
import type { IButterflyFlight } from "./arenaButterflySwarm.types";
import { fadeInOut, flightRotation, flutter, wingBeat } from "./arenaButterflySwarm.utils";

/**
 * A swarm of butterflies, planned once and flown along their own paths: each beats its wings (the sprite
 * narrows and opens), flutters off its path, wobbles and turns its head where its path goes (up when it hovers). Plain ones are
 * silhouettes that cover the scene, glowing ones light it; the two sit in two batches (one draw call each), the
 * glowing on top. Generic: any effect gives each butterfly a path as a function of time.
 */
export class ArenaButterflySwarm {
  readonly container = new Container();
  private readonly plain: ArenaFxParticles;
  private readonly glowing: ArenaFxParticles;

  constructor(
    private readonly textures: IArenaFxTextureSet,
    reach: number,
  ) {
    this.plain = new ArenaFxParticles(reach, "normal");
    this.glowing = new ArenaFxParticles(reach, "add");
    this.container.eventMode = "none";
    this.container.addChild(this.plain.container, this.glowing.container);
  }

  add(flight: IButterflyFlight): void {
    const { born, life, size, flap, seed } = flight;
    const at = (time: number) => {
      const point = flight.path(time);
      const off = flutter(time, seed, size);
      return { x: point.x + off.x, y: point.y + off.y };
    };
    const batch = flight.glowing ? this.glowing : this.plain;
    batch.add({
      texture: this.textures.butterfly,
      spawn: { x: 0, y: 0, vx: 0, vy: 0, drag: 0, gravity: 0, born, life },
      look: {
        size: (share) => size * wingBeat(share * life, flap),
        height: () => size * BUTTERFLY_BODY,
        alpha: flight.alpha ?? fadeInOut,
        tint: flight.tint,
        rotation: (age) =>
          flightRotation(flight.path, born + age, size) +
          BUTTERFLY_WOBBLE * Math.sin((born + age) * BUTTERFLY_FLUTTER.rate * 5 + seed),
        drift: (age) => at(born + age),
      },
    });
  }

  /** Places every butterfly `seconds` into the animation. */
  update(seconds: number): void {
    this.plain.update(seconds);
    this.glowing.update(seconds);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
