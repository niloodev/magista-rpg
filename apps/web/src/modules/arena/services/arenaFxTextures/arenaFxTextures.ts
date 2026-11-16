import { Rectangle, Texture } from "pixi.js";

import { FX_FRAME_SIZE, FX_FRAMES } from "./arenaFxTextures.constants";
import type { ArenaFxFrame, IArenaFxTextureSet } from "./arenaFxTextures.types";

type Painter = (context: CanvasRenderingContext2D, size: number) => void;

const radial = (context: CanvasRenderingContext2D, size: number, stops: [number, string][]) => {
  const half = size / 2;
  const gradient = context.createRadialGradient(half, half, 0, half, half, half);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
};

/** White shapes (tinted per particle) drawn once into the atlas. */
const PAINTERS: Record<ArenaFxFrame, Painter> = {
  glow: (context, size) =>
    radial(context, size, [
      [0, "rgba(255,255,255,1)"],
      [0.25, "rgba(255,255,255,0.55)"],
      [1, "rgba(255,255,255,0)"],
    ]),
  streak: (context, size) => {
    const half = size / 2;
    const gradient = context.createLinearGradient(0, 0, size, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.75, "rgba(255,255,255,0.9)");
    gradient.addColorStop(1, "rgba(255,255,255,1)");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(0, half);
    context.quadraticCurveTo(size * 0.7, half - size * 0.09, size, half);
    context.quadraticCurveTo(size * 0.7, half + size * 0.09, 0, half);
    context.fill();
  },
  shard: (context, size) => {
    context.fillStyle = "rgba(255,255,255,1)";
    context.beginPath();
    context.moveTo(size * 0.5, size * 0.08);
    context.lineTo(size * 0.78, size * 0.55);
    context.lineTo(size * 0.46, size * 0.92);
    context.lineTo(size * 0.24, size * 0.42);
    context.closePath();
    context.fill();
  },
  spark: (context, size) =>
    radial(context, size, [
      [0, "rgba(255,255,255,1)"],
      [0.12, "rgba(255,255,255,1)"],
      [0.3, "rgba(255,255,255,0.35)"],
      [1, "rgba(255,255,255,0)"],
    ]),
  smoke: (context, size) =>
    radial(context, size, [
      [0, "rgba(255,255,255,0.5)"],
      [0.6, "rgba(255,255,255,0.18)"],
      [1, "rgba(255,255,255,0)"],
    ]),
};

/**
 * The particle atlas of the Arena effects: soft glow, spark streak, shard, hot spark and smoke, painted once
 * on a canvas (no image to download) and shared by every effect, since a ParticleContainer needs all its
 * particles on the same texture source.
 */
export class ArenaFxTextures {
  readonly frames: IArenaFxTextureSet;
  private readonly atlas: Texture;

  constructor() {
    const canvas = document.createElement("canvas");
    canvas.width = FX_FRAME_SIZE * FX_FRAMES.length;
    canvas.height = FX_FRAME_SIZE;
    const context = canvas.getContext("2d");
    FX_FRAMES.forEach((frame, index) => {
      if (!context) return;
      context.save();
      context.translate(index * FX_FRAME_SIZE, 0);
      PAINTERS[frame](context, FX_FRAME_SIZE);
      context.restore();
    });
    this.atlas = Texture.from(canvas);
    const entries = FX_FRAMES.map((frame, index) => [
      frame,
      new Texture({
        source: this.atlas.source,
        frame: new Rectangle(index * FX_FRAME_SIZE, 0, FX_FRAME_SIZE, FX_FRAME_SIZE),
      }),
    ]);
    this.frames = Object.fromEntries(entries) as IArenaFxTextureSet;
  }

  destroy(): void {
    for (const texture of Object.values(this.frames)) texture.destroy(false);
    this.atlas.destroy(true);
  }
}
