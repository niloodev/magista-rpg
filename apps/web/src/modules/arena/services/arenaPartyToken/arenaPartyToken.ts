import { Container, Graphics, Sprite } from "pixi.js";

import { ArenaEnergyFlow } from "@/modules/arena/services/arenaEnergyFlow";

import {
  OTHALA_STROKES,
  PARTY_COLOR_BLEND_MS,
  PARTY_COLOR_HOLD_MS,
  PARTY_COLORS,
  PARTY_ENERGY,
  PARTY_GLOW,
  PARTY_LITE_STEP_MS,
  PARTY_RING_RUNES,
  PARTY_RING_SPIN,
  PARTY_RUNE_BOX,
  PARTY_SHAPE,
} from "./arenaPartyToken.constants";
import type { IArenaPartyTokenFrame, IArenaPartyTokenOptions } from "./arenaPartyToken.types";
import { mixColor, paletteOf, partyColorAt, pathStrokes } from "./arenaPartyToken.utils";

/**
 * The party token of the world map, a small seal: a dark disc in a thin gold frame, a ring of runes turning slowly
 * and, at its heart, the Othala rune (ᛟ), the mark of the group, with energy flowing along its strokes. The Othala,
 * the glow behind it and the runes take the color of each player in turn (holding it, then blending into the
 * next); the gold frame and the dark disc stay, so the colors always read. `back` goes under the token (the glow)
 * and `body` is the seal. In the light mode there is no energy, the ring stands still and the color steps.
 */
export class ArenaPartyToken {
  readonly back = new Container();
  readonly body = new Container();
  private readonly glow: Sprite;
  private readonly disc = new Graphics();
  private readonly frame = new Graphics();
  private readonly ring = new Container();
  private readonly runes = new Graphics();
  private readonly innerRing = new Graphics();
  private readonly underlay = new Graphics();
  private readonly selection = new Graphics();
  private readonly strokes: ArenaEnergyFlow[];
  private readonly start = performance.now();
  private size = 0;
  private color = -1;

  constructor(private readonly options: IArenaPartyTokenOptions) {
    this.back.eventMode = "none";
    this.body.eventMode = "none";
    this.glow = new Sprite(options.host.textures.glow);
    this.glow.anchor.set(0.5);
    this.glow.blendMode = "add";
    this.back.addChild(this.glow);
    this.ring.addChild(this.runes);
    this.body.addChild(this.disc, this.frame, this.ring, this.innerRing, this.underlay);
    this.strokes = options.lite
      ? []
      : OTHALA_STROKES.map(
          (_, index) =>
            new ArenaEnergyFlow({
              palette: paletteOf(options.colors[0] ?? 0xffffff),
              speed: PARTY_ENERGY.speed,
              sharpness: PARTY_ENERGY.sharpness,
              strands: PARTY_ENERGY.strands,
              samples: PARTY_ENERGY.samples,
              seed: options.seed + index * 7,
            }),
        );
    this.body.addChild(...this.strokes.map((stroke) => stroke.mesh), this.selection);
  }

  /** Fits the token to `size` (diameter, world pixels) and shows whether it is selected. */
  layout(size: number, selected: boolean): void {
    if (size !== this.size) {
      this.size = size;
      this.drawSeal(size);
    }
    this.selection.clear();
    if (selected) {
      this.selection
        .circle(0, 0, size * PARTY_SHAPE.selected)
        .stroke({ width: Math.max(1.5, size * 0.035), color: PARTY_COLORS.selected, alpha: 0.9 });
    }
  }

  /** Advances the color cycle, the turning ring and the energy to `now`. */
  step(now: number): IArenaPartyTokenFrame {
    const elapsed = now - this.start;
    const { colors, lite } = this.options;
    if (lite) {
      const index = Math.floor(elapsed / PARTY_LITE_STEP_MS) % Math.max(colors.length, 1);
      this.applyColor(colors[index] ?? 0xffffff);
      this.glow.alpha = PARTY_GLOW.alpha;
      return { animating: false, wakeInMs: PARTY_LITE_STEP_MS - (elapsed % PARTY_LITE_STEP_MS) };
    }
    this.applyColor(partyColorAt(elapsed, colors, PARTY_COLOR_HOLD_MS, PARTY_COLOR_BLEND_MS));
    const seconds = elapsed / 1000;
    this.ring.rotation = seconds * PARTY_RING_SPIN;
    const breath = Math.sin((elapsed / PARTY_GLOW.periodMs) * Math.PI * 2);
    this.glow.alpha = PARTY_GLOW.alpha + PARTY_GLOW.breath * breath;
    for (const stroke of this.strokes) stroke.update(seconds);
    return { animating: true, wakeInMs: null };
  }

  destroy(): void {
    for (const stroke of this.strokes) stroke.destroy();
    this.back.destroy({ children: true });
    this.body.destroy({ children: true });
  }

  private drawSeal(size: number): void {
    const shape = PARTY_SHAPE;
    this.disc
      .clear()
      .circle(0, 0, size * shape.disc)
      .fill({ color: PARTY_COLORS.disc, alpha: 0.92 });
    this.frame
      .clear()
      .circle(0, 0, size * shape.frame)
      .stroke({ width: size * shape.frameWidth, color: PARTY_COLORS.frame, alpha: 0.95 });
    this.innerRing
      .clear()
      .circle(0, 0, size * shape.innerRing)
      .stroke({ width: size * shape.innerWidth, color: 0xffffff, alpha: 0.6 });
    this.runes.clear();
    const runeScale = (size * shape.runeSize) / PARTY_RUNE_BOX;
    PARTY_RING_RUNES.forEach((path, index) => {
      const angle = (index / PARTY_RING_RUNES.length) * Math.PI * 2;
      const cx = Math.sin(angle) * size * shape.runeRing;
      const cy = -Math.cos(angle) * size * shape.runeRing;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      for (const stroke of pathStrokes(path, runeScale)) {
        stroke.forEach((point, at) => {
          const x = cx + point.x * cos - point.y * sin;
          const y = cy + point.x * sin + point.y * cos;
          if (at === 0) this.runes.moveTo(x, y);
          else this.runes.lineTo(x, y);
        });
      }
    });
    this.runes.stroke({
      width: size * shape.runeWidth,
      color: 0xffffff,
      cap: "round",
      join: "round",
    });
    const othala = size * shape.othala;
    this.underlay.clear();
    for (const stroke of OTHALA_STROKES) {
      const [first, ...rest] = stroke;
      this.underlay.moveTo(first.x * othala, first.y * othala);
      for (const point of rest) this.underlay.lineTo(point.x * othala, point.y * othala);
    }
    this.underlay.stroke({
      width: size * shape.underlay,
      color: 0xffffff,
      cap: "round",
      join: "round",
    });
    this.strokes.forEach((flow, index) => {
      const stroke = OTHALA_STROKES[index] ?? [];
      flow.setPath(
        stroke.map((point) => ({ x: point.x * othala, y: point.y * othala })),
        size * shape.energy,
      );
    });
    this.glow.width = size * shape.glow;
    this.glow.height = size * shape.glow;
  }

  private applyColor(color: number): void {
    if (color === this.color) return;
    this.color = color;
    const light = mixColor(color, 0xffffff, 0.55);
    this.glow.tint = color;
    this.underlay.tint = mixColor(color, 0xffffff, 0.15);
    this.runes.tint = light;
    this.innerRing.tint = light;
    const palette = paletteOf(color);
    for (const stroke of this.strokes) stroke.setColors(palette);
  }
}
