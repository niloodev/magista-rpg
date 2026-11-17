import { ColorMatrixFilter, Container, type Filter } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import {
  ArenaAmountText,
  phase,
  seededRandom,
  shake,
  type IArenaEffectFrame,
  type IArenaEffectOptions,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  DIVINE_DURATION_MS,
  DIVINE_IDENTITY_MATRIX,
  DIVINE_PHASES,
  DIVINE_RADIANT_MATRIX,
  DIVINE_SCREEN_KEY,
  DIVINE_SHOCKWAVE,
} from "./arenaDivineCallEffect.constants";
import type { IDivineScreen } from "./arenaDivineCallEffect.types";
import { DivineScreen } from "./subcomponents";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * "Chamado Divino", Heylel's ultimate of Lux: the heavens answer her call. A halo of flowing golden energy forms
 * above the target, streams of energy spiral down onto it, and a column of
 * light comes down: as a blessing (healing) the target rises lit from within, as a judgment (damage) it is struck
 * white and pressed down. The energy runs out and feathers of light fall.
 */
export class ArenaDivineCallEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  readonly impactMs = DIVINE_PHASES.impact * DIVINE_DURATION_MS;
  readonly tokenFilters: readonly Filter[];
  private readonly radiance = new ColorMatrixFilter();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.3,
    bloomScale: 1.3,
    blur: 5,
    quality: 3,
  });
  private readonly amount: ArenaAmountText;
  private readonly screen: IDivineScreen | null;
  private start: number | null = null;
  private struck = false;

  constructor(
    private readonly options: IArenaEffectOptions,
    private readonly host: IArenaFxHost,
  ) {
    this.amount = new ArenaAmountText(
      "divineCall",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.bloom.resolution = 1;
    this.container.eventMode = "none";
    this.container.addChild(this.amount.text);
    this.container.filters = [this.bloom];
    this.tokenFilters = [this.radiance];
    this.screen = host.screen.claim(DIVINE_SCREEN_KEY, DIVINE_DURATION_MS)
      ? new DivineScreen(host, seededRandom(options.seed * 23 + 9), options.kind, options.group)
      : null;
  }

  step(now: number, cameraScale: number, lift = 0): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now + (this.options.delayMs ?? 0);
    if (now < this.start) {
      this.container.visible = false;
      return { done: false, frame: REST };
    }
    this.container.visible = true;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / DIVINE_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    if (t < DIVINE_PHASES.impact) this.amount.text.visible = false;
    else this.amount.place(phase(t, DIVINE_PHASES.impact, 1), scale, r + lift, false);
    if (t >= 1) {
      this.radiance.matrix = DIVINE_IDENTITY_MATRIX as ColorMatrixFilter["matrix"];
      if (this.screen?.linger(this.container, r * scale, elapsed - DIVINE_DURATION_MS))
        return { done: false, frame: REST };
      this.screen?.end();
      return { done: true, frame: REST };
    }
    if (!this.struck && t >= DIVINE_PHASES.impact) {
      this.struck = true;
      const wave = DIVINE_SHOCKWAVE[this.options.kind];
      this.host.shockwave(this.container, r * scale * wave.radii, wave.durationMs, {
        amplitude: wave.amplitude,
        wavelength: wave.wavelength,
      });
    }
    const touched = phase(t, DIVINE_PHASES.descend, DIVINE_PHASES.impact) * 0.4;
    const flare = t >= DIVINE_PHASES.impact ? 1 - phase(t, DIVINE_PHASES.impact, 1) : 0;
    const glow = Math.min(touched + flare, 1);
    this.radiance.matrix = DIVINE_IDENTITY_MATRIX.map(
      (value, index) => value + ((DIVINE_RADIANT_MATRIX[index] ?? 0) - value) * glow,
    ) as ColorMatrixFilter["matrix"];
    this.screen?.step(t, this.container, r * scale);
    return { done: false, frame: this.fate(t, r) };
  }

  destroy(): void {
    this.screen?.end();
    this.container.filters = [];
    this.bloom.destroy();
    this.radiance.destroy();
    this.container.destroy({ children: true });
  }

  /**
   * Lifted a little while the light gathers; at the call a blessing raises it and lets it down softly, a
   * judgment slams it down and shakes it.
   */
  private fate(t: number, r: number): IArenaEffectFrame {
    const gather = phase(t, DIVINE_PHASES.descend, DIVINE_PHASES.impact);
    if (t < DIVINE_PHASES.impact)
      return {
        dx: 0,
        dy: -r * 0.12 * gather,
        scaleX: 1 + 0.04 * gather,
        scaleY: 1 + 0.04 * gather,
      };
    const after = phase(t, DIVINE_PHASES.impact, 1);
    if (this.options.kind === "heal") {
      const rise = Math.sin(Math.PI * Math.min(after * 1.3, 1));
      return {
        dx: 0,
        dy: -r * (0.12 + 0.3 * rise) * (1 - after),
        scaleX: 1 + 0.1 * rise * (1 - after),
        scaleY: 1 + 0.14 * rise * (1 - after),
      };
    }
    const crush = 0.32 * Math.exp(-after * 10);
    return {
      dx: shake(after, r * 0.12, 10, 0.4),
      dy: r * 0.2 * Math.exp(-after * 8),
      scaleX: 1 + crush * 0.8,
      scaleY: 1 - crush,
    };
  }
}
