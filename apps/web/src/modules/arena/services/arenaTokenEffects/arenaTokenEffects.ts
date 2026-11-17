import { Container, Graphics, Text } from "pixi.js";

import {
  EFFECT_COLORS,
  EFFECT_DURATION_MS,
  EFFECT_NUMBER_BASE_PX,
  EFFECT_NUMBER_PX,
} from "./arenaTokenEffects.constants";
import type {
  ArenaEffectStyle,
  IArenaEffectFrame,
  IArenaEffectOptions,
  IArenaEffectPlayer,
  IArenaPoint2,
} from "./arenaTokenEffects.types";
import { amountLabel, easeOutBack, effectStyle, phase } from "./arenaTokenEffects.utils";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/** Little rune strokes (unit size), drawn as lines because the fonts do not carry the runic block. */
export const RUNE_STROKES: IArenaPoint2[][][] = [
  [
    [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
    ],
    [
      { x: 0, y: -0.4 },
      { x: 0.6, y: -1 },
    ],
  ],
  [
    [
      { x: -0.5, y: 1 },
      { x: 0, y: -1 },
      { x: 0.5, y: 1 },
    ],
  ],
  [
    [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
    ],
    [
      { x: -0.5, y: -0.3 },
      { x: 0.5, y: 0.3 },
    ],
  ],
  [
    [
      { x: -0.5, y: -1 },
      { x: 0.5, y: 0 },
      { x: -0.5, y: 1 },
    ],
  ],
];

/**
 * The amount of a change floating above a token ("-5", "+3"), in the color of the attribute it changed (health
 * ruby, sanity teal), with the motion of its animation: it jumps and
 * falls (Golpe), trembles (Fissura) or rises (healing). It keeps the same size on screen at any zoom, and in the
 * light mode it just stays a moment.
 */
export class ArenaAmountText {
  readonly text: Text;

  constructor(
    private readonly style: ArenaEffectStyle,
    kind: IArenaEffectOptions["kind"],
    resource: IArenaEffectOptions["resource"],
    amount: number,
    fontFamily: string,
  ) {
    this.text = new Text({
      text: amountLabel(kind, amount),
      style: {
        fontFamily,
        fontSize: EFFECT_NUMBER_BASE_PX,
        fontWeight: "700",
        fill: AMOUNT_COLORS[resource],
        stroke: { color: EFFECT_COLORS.black, width: 8, join: "round" },
      },
    });
    this.text.anchor.set(0.5);
  }

  /** Places the amount at progress `t`, above `top` map pixels from the token center. */
  place(t: number, scale: number, top: number, lite: boolean): void {
    const text = this.text;
    const base = EFFECT_NUMBER_PX / EFFECT_NUMBER_BASE_PX / scale;
    text.visible = t < 1;
    if (t >= 1) return;
    if (lite) {
      text.scale.set(base);
      text.position.set(0, -top - 14 / scale);
      text.alpha = t < 0.8 ? 1 : 1 - (t - 0.8) * 5;
      return;
    }
    const pop = easeOutBack(phase(t, 0, 0.22));
    text.scale.set(base * (0.5 + 0.5 * pop));
    text.alpha = t < 0.65 ? 1 : 1 - phase(t, 0.65, 1);
    const y = -top - 12 / scale;
    if (this.style === "strike") {
      const jump = Math.sin(Math.PI * Math.min(phase(t, 0, 0.7), 1)) * 26;
      const fall = phase(t, 0.7, 1) * 10;
      text.position.set(0, y - (jump - fall) / scale);
    } else if (this.style === "fissure") {
      const tremble = (1 - phase(t, 0, 0.6)) * Math.sin(t * 90) * 2.5;
      text.position.set(tremble / scale, y - (phase(t, 0, 1) * 18) / scale);
    } else {
      const rise = (this.style === "ember" ? 34 : 26) * Math.sin(phase(t, 0, 1) * Math.PI * 0.5);
      text.position.set(0, y - rise / scale);
    }
  }
}

const AMOUNT_COLORS: Record<IArenaEffectOptions["resource"], number> = {
  health: EFFECT_COLORS.rubyLight,
  sanity: EFFECT_COLORS.tealLight,
};

/**
 * The light animation of a change (performance mode and reduced motion): the token flashes in the color of the
 * change and the amount stays above it for a moment. The rich ones live in their own services.
 */
export class ArenaTokenEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly graphics = new Graphics();
  private readonly number: ArenaAmountText;
  private readonly style: ArenaEffectStyle;
  private start: number | null = null;

  constructor(private readonly options: IArenaEffectOptions) {
    this.style = effectStyle(options.kind, options.resource, options.style);
    this.number = new ArenaAmountText(
      this.style,
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.container.eventMode = "none";
    this.container.addChild(this.graphics, this.number.text);
  }

  /**
   * Draws the frame at `now`; `done` once it is over. `lift` is the height above the token already taken (the
   * status bars), so the amount shows over them.
   */
  step(now: number, cameraScale: number, lift = 0): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now + (this.options.delayMs ?? 0);
    if (now < this.start) {
      this.container.visible = false;
      return { done: false, frame: REST };
    }
    this.container.visible = true;
    const t = Math.min((now - this.start) / EFFECT_DURATION_MS.lite, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const radius = this.options.size / 2;
    this.graphics.clear();
    this.number.place(t, scale, radius + lift, true);
    if (t >= 1) return { done: true, frame: REST };
    const strength = 1 - phase(t, 0, 0.5);
    if (strength > 0)
      this.graphics
        .circle(0, 0, radius)
        .fill({ color: FLASH_COLORS[this.style], alpha: 0.5 * strength });
    return { done: false, frame: REST };
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}

const FLASH_COLORS: Record<ArenaEffectStyle, number> = {
  strike: EFFECT_COLORS.ruby,
  fissure: EFFECT_COLORS.tealDeep,
  ember: EFFECT_COLORS.rose,
  clarity: EFFECT_COLORS.tealLight,
  gunshot: EFFECT_COLORS.gold,
  voxPopuli: EFFECT_COLORS.ruby,
  vitaeUnius: EFFECT_COLORS.gold,
  entropiaPoema: EFFECT_COLORS.ruby,
  shovel: EFFECT_COLORS.white,
  soulDrain: EFFECT_COLORS.nox,
  deathRebirth: EFFECT_COLORS.nox,
  divineCall: EFFECT_COLORS.gold,
  floralStrike: EFFECT_COLORS.rose,
  floralCast: EFFECT_COLORS.rose,
  voodooAxe: EFFECT_COLORS.voodoo,
  voodooFire: EFFECT_COLORS.voodoo,
  nonEuclidean: EFFECT_COLORS.geometry,
};
