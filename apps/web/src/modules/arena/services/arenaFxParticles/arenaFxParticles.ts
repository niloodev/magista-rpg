import { Particle, ParticleContainer, Rectangle } from "pixi.js";

import { particlePosition, particleVelocity } from "@/modules/arena/services/arenaTokenEffects";

import type { IFxParticleSpec } from "./arenaFxParticles.types";

const FRAME = 64;

interface IFxEntry {
  spec: IFxParticleSpec;
  particle: Particle;
}

/**
 * A batch of planned particles on one ParticleContainer (one draw call): each is launched with drag and gravity
 * and drawn by its own look (size, color, alpha, rotation, drift) over its life. Nothing is created after the
 * start; the frame only moves what is there.
 */
export class ArenaFxParticles {
  readonly container: ParticleContainer;
  private readonly entries: IFxEntry[] = [];

  constructor(reach: number, blend: "add" | "normal" = "add") {
    this.container = new ParticleContainer({
      dynamicProperties: { position: true, rotation: true, vertex: true, color: true },
    });
    this.container.blendMode = blend;
    this.container.boundsArea = new Rectangle(-reach, -reach, reach * 2, reach * 2);
  }

  add(spec: IFxParticleSpec): void {
    const particle = new Particle({
      texture: spec.texture,
      x: spec.spawn.x,
      y: spec.spawn.y,
      anchorX: spec.anchorX ?? 0.5,
      anchorY: 0.5,
      alpha: 0,
    });
    this.container.addParticle(particle);
    this.entries.push({ spec, particle });
  }

  /** Places every particle `seconds` into the animation. */
  update(seconds: number): void {
    for (const { spec, particle } of this.entries) {
      const { spawn, look } = spec;
      const age = seconds - spawn.born;
      const life = age / spawn.life;
      if (age < 0 || life >= 1) {
        particle.alpha = 0;
        continue;
      }
      const position = particlePosition(spawn, age);
      const drift = look.drift?.(age);
      particle.x = position.x + (drift?.x ?? 0);
      particle.y = position.y + (drift?.y ?? 0);
      particle.scaleX = look.size(life) / FRAME;
      particle.scaleY = (look.height ?? look.size)(life) / FRAME;
      particle.tint = look.tint(life);
      particle.alpha = Math.min(Math.max(look.alpha(life, age), 0), 1);
      if (look.rotation) particle.rotation = look.rotation(age, particleVelocity(spawn, age));
    }
  }
}
