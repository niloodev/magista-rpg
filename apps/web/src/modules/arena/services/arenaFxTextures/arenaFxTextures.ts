import { Rectangle, Texture } from "pixi.js";

import {
  FX_DIGITS,
  FX_ATLAS_COLUMNS,
  FX_FRAME_SIZE,
  FX_FRAMES,
  FX_GLYPH_FONT,
  FX_GLYPHS,
} from "./arenaFxTextures.constants";
import type { ArenaFxFrame, IArenaFxTextureSet } from "./arenaFxTextures.types";
import { atlasCell, smooth } from "./arenaFxTextures.utils";

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
  petal: (context, size) => {
    const half = size / 2;
    const gradient = context.createLinearGradient(half, size * 0.92, half, size * 0.08);
    gradient.addColorStop(0, "rgba(255,255,255,0.7)");
    gradient.addColorStop(0.6, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0.92)");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(half, size * 0.94);
    context.bezierCurveTo(
      size * 0.12,
      size * 0.62,
      size * 0.16,
      size * 0.12,
      half * 0.86,
      size * 0.1,
    );
    context.lineTo(half, size * 0.17);
    context.lineTo(half * 1.14, size * 0.1);
    context.bezierCurveTo(size * 0.84, size * 0.12, size * 0.88, size * 0.62, half, size * 0.94);
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.45)";
    context.lineWidth = size * 0.02;
    context.beginPath();
    context.moveTo(half, size * 0.88);
    context.lineTo(half, size * 0.3);
    context.stroke();
  },
  beam: (context, size) => {
    const half = size / 2;
    for (let row = 0; row < size; row += 1) {
      const down = row / (size - 1);
      const reach = size * (0.1 + 0.38 * down);
      const strength = smooth(down / 0.4) * (1 - 0.65 * smooth((down - 0.82) / 0.18));
      const gradient = context.createLinearGradient(half - reach, 0, half + reach, 0);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(0.3, `rgba(255,255,255,${(0.45 * strength).toFixed(3)})`);
      gradient.addColorStop(0.5, `rgba(255,255,255,${strength.toFixed(3)})`);
      gradient.addColorStop(0.7, `rgba(255,255,255,${(0.45 * strength).toFixed(3)})`);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(half - reach, row, reach * 2, 1);
    }
  },
  link: (context, size) => {
    const half = size / 2;
    context.lineWidth = size * 0.13;
    context.strokeStyle = "rgba(255,255,255,1)";
    context.beginPath();
    context.ellipse(half, half, size * 0.24, size * 0.4, 0, 0, Math.PI * 2);
    context.stroke();
    context.lineWidth = size * 0.04;
    context.strokeStyle = "rgba(255,255,255,0.55)";
    context.beginPath();
    context.ellipse(
      half - size * 0.03,
      half - size * 0.03,
      size * 0.22,
      size * 0.37,
      0,
      Math.PI,
      Math.PI * 1.6,
    );
    context.stroke();
  },
  blossom: (context, size) => {
    const half = size / 2;
    context.fillStyle = "rgba(255,255,255,0.95)";
    for (let index = 0; index < 5; index += 1) {
      const a = (index / 5) * Math.PI * 2 - Math.PI / 2;
      context.beginPath();
      context.ellipse(
        half + Math.cos(a) * size * 0.2,
        half + Math.sin(a) * size * 0.2,
        size * 0.2,
        size * 0.13,
        a,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    context.fillStyle = "rgba(255,255,255,1)";
    context.beginPath();
    context.arc(half, half, size * 0.1, 0, Math.PI * 2);
    context.fill();
  },
  butterfly: (context, size) => {
    const half = size / 2;
    const wings = (side: number, inset: number) => {
      const x = (share: number) => half + side * (share - 0.5) * size * inset;
      const y = (share: number) => size * 0.47 + (share - 0.47) * size * inset;
      context.beginPath();
      context.moveTo(x(0.52), y(0.36));
      context.bezierCurveTo(x(0.62), y(0.08), x(0.9), y(0.02), x(0.97), y(0.12));
      context.bezierCurveTo(x(1.0), y(0.3), x(0.84), y(0.46), x(0.53), y(0.5));
      context.bezierCurveTo(x(0.8), y(0.52), x(0.9), y(0.7), x(0.8), y(0.86));
      context.bezierCurveTo(x(0.7), y(0.96), x(0.56), y(0.8), x(0.52), y(0.6));
      context.closePath();
    };
    context.fillStyle = "rgba(255,255,255,1)";
    for (const side of [1, -1]) {
      wings(side, 1);
      context.fill();
    }
    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "rgba(255,255,255,0.42)";
    for (const side of [1, -1]) {
      wings(side, 0.72);
      context.fill();
    }
    context.globalCompositeOperation = "source-over";
    context.fillStyle = "rgba(255,255,255,1)";
    for (const side of [1, -1]) {
      context.beginPath();
      context.arc(half + side * size * 0.29, size * 0.24, size * 0.045, 0, Math.PI * 2);
      context.fill();
    }
    context.beginPath();
    context.ellipse(half, size * 0.5, size * 0.03, size * 0.2, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.8)";
    context.lineWidth = size * 0.015;
    for (const side of [1, -1]) {
      context.beginPath();
      context.moveTo(half, size * 0.32);
      context.quadraticCurveTo(
        half + side * size * 0.04,
        size * 0.18,
        half + side * size * 0.1,
        size * 0.12,
      );
      context.stroke();
    }
  },
};

/**
 * The particle atlas of the Arena effects: soft glow, spark streak, shard, hot spark, smoke, petals, a light beam, a chain link, a butterfly and math glyphs, painted once
 * on a canvas (no image to download) and shared by every effect, since a ParticleContainer needs all its
 * particles on the same texture source.
 */
export class ArenaFxTextures {
  readonly frames: IArenaFxTextureSet;
  private readonly atlas: Texture;

  constructor() {
    const canvas = document.createElement("canvas");
    const texts = [...FX_GLYPHS, ...FX_DIGITS];
    const slots = FX_FRAMES.length + texts.length;
    canvas.width = FX_FRAME_SIZE * Math.min(slots, FX_ATLAS_COLUMNS);
    canvas.height = FX_FRAME_SIZE * Math.ceil(slots / FX_ATLAS_COLUMNS);
    const context = canvas.getContext("2d");
    FX_FRAMES.forEach((frame, index) => {
      if (!context) return;
      context.save();
      const { x, y } = atlasCell(index);
      context.translate(x, y);
      PAINTERS[frame](context, FX_FRAME_SIZE);
      context.restore();
    });
    if (context) {
      context.fillStyle = "rgba(255,255,255,1)";
      context.font = FX_GLYPH_FONT;
      context.textAlign = "center";
      context.textBaseline = "middle";
      texts.forEach((glyph, index) => {
        const { x, y } = atlasCell(FX_FRAMES.length + index);
        context.fillText(
          glyph,
          x + FX_FRAME_SIZE / 2,
          y + FX_FRAME_SIZE / 2 + 2,
          FX_FRAME_SIZE - 6,
        );
      });
    }
    this.atlas = Texture.from(canvas);
    const cell = (index: number) => {
      const { x, y } = atlasCell(index);
      return new Texture({
        source: this.atlas.source,
        frame: new Rectangle(x, y, FX_FRAME_SIZE, FX_FRAME_SIZE),
      });
    };
    const entries = FX_FRAMES.map((frame, index) => [frame, cell(index)]);
    const slot = (index: number) => cell(FX_FRAMES.length + index);
    const glyphs = FX_GLYPHS.map((_, index) => slot(index));
    const digits = FX_DIGITS.map((_, index) => slot(FX_GLYPHS.length + index));
    this.frames = { ...Object.fromEntries(entries), glyphs, digits } as IArenaFxTextureSet;
  }

  destroy(): void {
    for (const frame of FX_FRAMES) this.frames[frame].destroy(false);
    for (const glyph of [...this.frames.glyphs, ...this.frames.digits]) glyph.destroy(false);
    this.atlas.destroy(true);
  }
}
