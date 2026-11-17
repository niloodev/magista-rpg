import { ColorMatrixFilter, Container, Graphics, Sprite, type Filter } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  ArenaAmountText,
  easeOutBack,
  mixColor,
  mixStops,
  phase,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectOptions,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  VITAE_BEAT_WIDTH,
  VITAE_BEATS,
  VITAE_COLORS,
  VITAE_CURSE_SHARDS,
  VITAE_DUB_GAP,
  VITAE_DURATION_MS,
  VITAE_IDENTITY_MATRIX,
  VITAE_LEAVES_PER_VINE,
  VITAE_LOTUS_LAYERS,
  VITAE_PETALS,
  VITAE_PHASES,
  VITAE_POLLEN,
  VITAE_RADIANT_MATRIX,
  VITAE_SCREEN_KEY,
  VITAE_SHOCKWAVE,
  VITAE_SWIRL_LEAVES,
  VITAE_VINES,
} from "./arenaVitaeUniusEffect.constants";
import type { IVitaeScreen, IVitaeVine } from "./arenaVitaeUniusEffect.types";
import { heartbeat, leafShape, pathPoint, vinePath } from "./arenaVitaeUniusEffect.utils";
import { VitaeScreen } from "./subcomponents";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * "Vitae Unius", Tony's ultimate: true life, given by touch. Dawn falls on the board (the world warms and light
 * pours from above), a seed of light comes down on the target and its heart starts to beat; with every beat the
 * Flower of Life is woven around it on the ground, vines of living light grow out of it with their leaves, and
 * the lights of everyone on the screen rise and come to it (Vitae Populi). Then the flower folds into the target
 * and it blooms: a great flower of gold and pink opens over it, every curse on it is torn off and burns into
 * light (Negação Absoluta), rays turn across the screen and petals storm it; the vines flower, and the target
 * keeps glowing while pollen rises and petals fall.
 */
export class ArenaVitaeUniusEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  readonly impactMs = VITAE_PHASES.bloom * VITAE_DURATION_MS;
  readonly tokenFilters: readonly Filter[];
  private readonly radiance = new ColorMatrixFilter();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.25,
    bloomScale: 1.5,
    brightness: 1.08,
    blur: 7,
    quality: 3,
  });
  private readonly ground = new Graphics();
  private readonly pulse = new Graphics();
  private readonly lotus = new Container();
  private readonly lotusLayers: Container[] = [];
  private readonly core: Sprite;
  private readonly halo: Sprite;
  private readonly sparks: ArenaFxParticles;
  private readonly curses: ArenaFxParticles;
  private readonly amount: ArenaAmountText;
  private readonly vines: IVitaeVine[] = [];
  private readonly screen: IVitaeScreen | null;
  private groundKey = "";
  private start: number | null = null;
  private struck = false;

  constructor(
    private readonly options: IArenaEffectOptions,
    private readonly host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    const random = seededRandom(options.seed);
    const turn = random() * Math.PI * 2;
    for (let index = 0; index < VITAE_VINES; index += 1) {
      const angle = turn + (index / VITAE_VINES) * Math.PI * 2 + (random() - 0.5) * 0.4;
      const curl = (random() > 0.5 ? 1 : -1) * (0.8 + random() * 1.1);
      this.vines.push({
        ...vinePath(
          angle,
          r * 0.95,
          r * (2.2 + random() * 1.3),
          curl,
          VITAE_LEAVES_PER_VINE,
          random,
        ),
        delay: random() * 0.35,
        width: r * (0.07 + random() * 0.04),
      });
    }
    this.halo = new Sprite(host.textures.glow);
    this.halo.anchor.set(0.5);
    this.halo.tint = VITAE_COLORS.emerald;
    this.halo.blendMode = "add";
    this.halo.visible = false;
    this.core = new Sprite(host.textures.glow);
    this.buildLotus(host, r);
    this.sparks = new ArenaFxParticles(r * 10, "add");
    this.curses = new ArenaFxParticles(r * 6, "normal");
    this.plan(host, r, random);
    this.amount = new ArenaAmountText(
      "vitaeUnius",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.pulse.blendMode = "add";
    this.bloom.resolution = 1;
    this.container.eventMode = "none";
    this.container.addChild(
      this.halo,
      this.ground,
      this.pulse,
      this.lotus,
      this.curses.container,
      this.sparks.container,
      this.amount.text,
    );
    this.container.filters = [this.bloom];
    this.tokenFilters = [this.radiance];
    this.screen = host.screen.claim(VITAE_SCREEN_KEY, VITAE_DURATION_MS)
      ? new VitaeScreen(host, seededRandom(options.seed * 7 + 1), options.group)
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
    const t = Math.min(elapsed / VITAE_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    if (t < VITAE_PHASES.bloom) this.amount.text.visible = false;
    else this.amount.place(phase(t, VITAE_PHASES.bloom, 1), scale, r + lift, false);
    if (t >= 1) {
      this.radiance.matrix = VITAE_IDENTITY_MATRIX as ColorMatrixFilter["matrix"];
      this.screen?.end();
      return { done: true, frame: REST };
    }
    if (!this.struck && t >= VITAE_PHASES.bloom) {
      this.struck = true;
      this.host.shockwave(
        this.container,
        r * scale * VITAE_SHOCKWAVE.radii,
        VITAE_SHOCKWAVE.durationMs,
        {
          amplitude: VITAE_SHOCKWAVE.amplitude,
          wavelength: VITAE_SHOCKWAVE.wavelength,
          brightness: VITAE_SHOCKWAVE.brightness,
        },
      );
    }
    const beat = heartbeat(t, VITAE_BEATS, VITAE_DUB_GAP, VITAE_BEAT_WIDTH);
    this.drawGround(t);
    this.drawPulse(t, r, scale);
    this.placeLotus(t, elapsed / 1000, r);
    this.placeHalo(t, r, beat);
    this.glow(t, beat);
    this.sparks.update(elapsed / 1000);
    this.curses.update(elapsed / 1000);
    this.screen?.step(t, this.container, r * scale);
    return { done: false, frame: this.breathe(t, beat, r) };
  }

  destroy(): void {
    this.screen?.end();
    this.container.filters = [];
    this.bloom.destroy();
    this.radiance.destroy();
    this.container.destroy({ children: true });
  }

  /**
   * The target breathes with the heart, is pressed down while the flower folds into it, swells with the bloom
   * and floats up a little while it glows.
   */
  private breathe(t: number, beat: number, r: number): IArenaEffectFrame {
    if (t < VITAE_PHASES.bloom) {
      const press = phase(t, VITAE_PHASES.fold, VITAE_PHASES.bloom);
      const swell = 1 + 0.07 * beat - 0.08 * press;
      return { dx: 0, dy: 0, scaleX: swell + 0.03 * press, scaleY: swell - 0.02 * press };
    }
    const after = phase(t, VITAE_PHASES.bloom, 1);
    const swell = 0.24 * Math.exp(-after * 9) + 0.04 * (1 - after);
    const rise = Math.sin(Math.PI * Math.min(after * 1.4, 1)) * r * 0.12;
    return { dx: 0, dy: -rise, scaleX: 1 + swell, scaleY: 1 + swell };
  }

  /** The target lit from within: a little with each beat, all white gold at the bloom, warm after it. */
  private glow(t: number, beat: number): void {
    const flash =
      t >= VITAE_PHASES.bloom ? 1 - phase(t, VITAE_PHASES.bloom, VITAE_PHASES.settle) : 0;
    const warm = 0.25 * (1 - phase(t, VITAE_PHASES.settle, 1)) * (t >= VITAE_PHASES.bloom ? 1 : 0);
    const amount = Math.min(
      0.35 * beat + flash + warm + 0.25 * phase(t, VITAE_PHASES.fold, VITAE_PHASES.bloom),
      1,
    );
    this.radiance.matrix = VITAE_IDENTITY_MATRIX.map(
      (value, index) => value + ((VITAE_RADIANT_MATRIX[index] ?? 0) - value) * amount,
    ) as ColorMatrixFilter["matrix"];
  }

  /**
   * The vines of living light: they grow out of the target while the flower is woven (dark jade under, emerald,
   * a bright vein), sprout their leaves as they pass and flower at their tips with the bloom; redrawn only while
   * something grows.
   */
  private drawGround(t: number): void {
    const weave = phase(t, VITAE_PHASES.weave, VITAE_PHASES.fold);
    const flowers = easeOutBack(phase(t, VITAE_PHASES.bloom, VITAE_PHASES.bloom + 0.08));
    this.ground.alpha = 1 - phase(t, 0.86, 1);
    const key = `${weave.toFixed(3)}|${flowers.toFixed(3)}`;
    if (key === this.groundKey) return;
    this.groundKey = key;
    const g = this.ground.clear();
    const r = this.options.size / 2;
    for (const vine of this.vines) {
      const grown = phase(weave, vine.delay, Math.min(vine.delay + 0.6, 1));
      if (grown <= 0) continue;
      const count = Math.max(2, Math.ceil(vine.points.length * grown));
      const shown = vine.points.slice(0, count).flatMap((point) => [point.x, point.y]);
      const base = vine.points
        .slice(0, Math.max(2, Math.ceil(count * 0.55)))
        .flatMap((point) => [point.x, point.y]);
      g.poly(shown, false).stroke({
        width: vine.width,
        color: VITAE_COLORS.deep,
        alpha: 0.9,
        cap: "round",
      });
      g.poly(base, false).stroke({
        width: vine.width * 1.7,
        color: VITAE_COLORS.deep,
        alpha: 0.9,
        cap: "round",
      });
      g.poly(shown, false).stroke({
        width: vine.width * 0.55,
        color: VITAE_COLORS.emerald,
        cap: "round",
      });
      g.poly(shown, false).stroke({
        width: vine.width * 0.2,
        color: VITAE_COLORS.leaf,
        cap: "round",
      });
      for (const leaf of vine.leaves) {
        const open = phase(grown, leaf.at, leaf.at + 0.18);
        if (open <= 0) continue;
        const { point, angle } = pathPoint(vine.points, leaf.at);
        const length = r * 0.42 * leaf.size * easeOutBack(open);
        const shape = leafShape(point, angle + leaf.side * 0.95, length);
        g.poly(shape).fill({ color: VITAE_COLORS.jade, alpha: 0.95 });
        g.moveTo(point.x, point.y)
          .lineTo(
            point.x + Math.cos(angle + leaf.side * 0.95) * length * 0.85,
            point.y + Math.sin(angle + leaf.side * 0.95) * length * 0.85,
          )
          .stroke({ width: Math.max(length * 0.06, 0.5), color: VITAE_COLORS.leaf, alpha: 0.9 });
      }
      if (grown >= 1 && flowers > 0) {
        const { point } = pathPoint(vine.points, 1);
        const size = r * 0.36 * flowers;
        for (let petal = 0; petal < 5; petal += 1) {
          const angle = (petal / 5) * Math.PI * 2 + vine.delay * 9;
          g.poly(leafShape(point, angle, size)).fill({ color: VITAE_COLORS.blossom, alpha: 0.95 });
        }
        g.circle(point.x, point.y, size * 0.28).fill({ color: VITAE_COLORS.gold });
      }
    }
  }

  /** Rings of light leaving the target with each beat of its heart, and the great one of the bloom. */
  private drawPulse(t: number, r: number, scale: number): void {
    const g = this.pulse.clear();
    const span = 0.12;
    const rings: { at: number; strength: number; reach: number }[] = [];
    for (const beat of VITAE_BEATS) {
      rings.push({ at: beat, strength: 1, reach: 3 });
      rings.push({ at: beat + VITAE_DUB_GAP, strength: 0.6, reach: 2.2 });
    }
    rings.push({ at: VITAE_PHASES.bloom, strength: 1.6, reach: 7 });
    for (const ring of rings) {
      const since = (t - ring.at) / span;
      if (since < 0 || since >= 1) continue;
      const radius = r * (0.9 + ring.reach * since ** 0.7);
      const fade = (1 - since) * ring.strength;
      g.circle(0, 0, radius).stroke({
        width: Math.max(r * 0.12 * (1 - since) * ring.strength, 1.5 / scale),
        color: VITAE_COLORS.emerald,
        alpha: 0.5 * Math.min(fade, 1),
      });
      g.circle(0, 0, radius).stroke({
        width: Math.max(r * 0.035, 1 / scale),
        color: VITAE_COLORS.mint,
        alpha: 0.9 * Math.min(fade, 1),
      });
    }
  }

  /**
   * The flower of light of the bloom: layers of soft petals (the painted petal of the atlas, so the edges stay
   * smooth at any size), each with a lighter heart, around a glowing core; drawn once, then opened, turned and
   * faded by transform.
   */
  private buildLotus(host: IArenaFxHost, r: number): void {
    for (const layer of VITAE_LOTUS_LAYERS) {
      const ring = new Container();
      for (let petal = 0; petal < layer.petals; petal += 1) {
        const angle = (petal / layer.petals) * Math.PI * 2 + (layer.petals % 2) * 0.2;
        for (const [width, height, color, alpha] of [
          [0.55, 1, layer.color, layer.alpha],
          [0.26, 0.62, layer.heart, layer.alpha * 0.65],
        ] as const) {
          const sprite = new Sprite(host.textures.petal);
          sprite.anchor.set(0.5, 0.94);
          sprite.width = r * layer.length * width;
          sprite.height = r * layer.length * height;
          sprite.rotation = angle + Math.PI / 2;
          sprite.tint = color;
          sprite.alpha = alpha;
          sprite.blendMode = "add";
          ring.addChild(sprite);
        }
      }
      this.lotusLayers.push(ring);
      this.lotus.addChild(ring);
    }
    this.core.anchor.set(0.5);
    this.core.blendMode = "add";
    this.core.tint = VITAE_COLORS.mint;
    this.lotus.addChild(this.core);
    this.lotus.visible = false;
  }

  private placeLotus(t: number, seconds: number, r: number): void {
    const fade = 1 - phase(t, VITAE_PHASES.settle, 0.95);
    const first = phase(t, VITAE_PHASES.bloom - 0.01, VITAE_PHASES.bloom + 0.08);
    this.lotus.visible = first > 0 && fade > 0;
    if (!this.lotus.visible) return;
    this.lotus.alpha = fade;
    this.lotusLayers.forEach((layer, index) => {
      const spec = VITAE_LOTUS_LAYERS[index];
      const delay = spec?.delay ?? 0;
      const open = easeOutBack(
        phase(t, VITAE_PHASES.bloom - 0.01 + delay, VITAE_PHASES.bloom + 0.08 + delay),
      );
      const breath = 1 + 0.035 * Math.sin(seconds * 4 + index * 1.3);
      layer.scale.set(Math.max(open, 0) * breath * (1 + 0.12 * (1 - fade)));
      layer.rotation = (spec?.spin ?? 0) * seconds;
    });
    const flare = 1 - phase(t, VITAE_PHASES.bloom, VITAE_PHASES.settle);
    this.core.width = this.core.height = r * (1.6 + 1.6 * flare);
    this.core.alpha = 0.6 + 0.4 * flare;
  }

  /** A green halo behind the target: faint with the beats, huge at the bloom, staying while it glows. */
  private placeHalo(t: number, r: number, beat: number): void {
    const flash =
      t >= VITAE_PHASES.bloom ? 1 - phase(t, VITAE_PHASES.bloom, VITAE_PHASES.settle) : 0;
    const stay = phase(t, VITAE_PHASES.seed, VITAE_PHASES.weave) * (1 - phase(t, 0.85, 1));
    const strength = Math.max(0.25 * stay + 0.35 * beat, flash);
    this.halo.visible = strength > 0;
    this.halo.alpha = Math.min(strength, 1);
    this.halo.width = this.halo.height = r * (4 + 5 * flash + 0.8 * beat);
    this.halo.tint = mixColor(VITAE_COLORS.emerald, VITAE_COLORS.mint, flash);
  }

  /**
   * Everything planned at once: leaves swirling up around the target while the flower is woven, the curses torn
   * off at the bloom (dark shards that turn to gold and burn away), the burst of petals and the pollen after.
   */
  private plan(host: IArenaFxHost, r: number, random: () => number): void {
    const frames = host.textures;
    const seconds = VITAE_DURATION_MS / 1000;
    const weave = VITAE_PHASES.weave * seconds;
    const fold = VITAE_PHASES.fold * seconds;
    const bloom = VITAE_PHASES.bloom * seconds;
    for (let index = 0; index < VITAE_SWIRL_LEAVES; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = r * (1.2 + random() * 0.8);
      const life = 0.9 + random() * 0.6;
      const size = r * (0.16 + random() * 0.12);
      const spin = 2 + random() * 1.5;
      this.sparks.add({
        texture: frames.petal,
        spawn: {
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          drag: 0,
          gravity: 0,
          born: weave + random() * Math.max(fold - weave - life * 0.6, 0.1),
          life,
        },
        look: {
          size: () => size,
          height: (l) => size * (0.5 + 0.5 * Math.abs(Math.cos(l * 8 + angle))),
          alpha: (l) => Math.sin(Math.PI * l) * 0.9,
          tint: (l) => mixStops([VITAE_COLORS.leaf, VITAE_COLORS.emerald, VITAE_COLORS.gold], l),
          rotation: (age) => angle + age * spin * 2,
          drift: (age) => {
            const share = age / life;
            const turn = angle + age * spin;
            const reach = radius * (1 - share * 0.55);
            return {
              x: Math.cos(turn) * reach,
              y: Math.sin(turn) * reach * 0.55 - share * r * 1.6,
            };
          },
        },
      });
    }
    for (let index = 0; index < VITAE_CURSE_SHARDS; index += 1) {
      const angle = random() * Math.PI * 2;
      const from = r * 0.55 * Math.sqrt(random());
      const speed = r * (1.6 + random() * 2.4);
      const size = r * (0.18 + random() * 0.16);
      const flicker = random() * 10;
      const spin = (random() - 0.5) * 9;
      this.curses.add({
        texture: frames.shard,
        spawn: {
          x: Math.cos(angle) * from,
          y: Math.sin(angle) * from,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - r * 0.8,
          drag: 1.4,
          gravity: -r * 0.6,
          born: bloom - 0.08 + random() * 0.06,
          life: 0.8 + random() * 0.4,
        },
        look: {
          size: (l) => size * (1 - phase(l, 0.5, 1) * 0.7),
          height: (l) => size * (0.4 + 0.6 * Math.abs(Math.cos(l * 7 + flicker))),
          alpha: (l) => Math.min(l * 8, 1) * (1 - phase(l, 0.55, 1)),
          tint: (l) =>
            l < 0.3
              ? Math.sin(l * 60 + flicker) > 0.4
                ? VITAE_COLORS.curseEdge
                : VITAE_COLORS.curse
              : mixStops(
                  [VITAE_COLORS.curseEdge, VITAE_COLORS.gold, VITAE_COLORS.spring],
                  phase(l, 0.3, 0.6),
                ),
          rotation: (age) => flicker + age * spin,
        },
      });
      this.sparks.add({
        texture: frames.spark,
        spawn: {
          x: Math.cos(angle) * from,
          y: Math.sin(angle) * from,
          vx: Math.cos(angle) * speed * 0.9,
          vy: Math.sin(angle) * speed * 0.9 - r * 1.2,
          drag: 1.4,
          gravity: -r * 0.8,
          born: bloom + 0.2 + random() * 0.15,
          life: 0.6 + random() * 0.4,
        },
        look: {
          size: (l) => size * 0.7 * (1 - l),
          alpha: (l, age) => (1 - l) * (0.6 + 0.4 * Math.sin(age * 40 + flicker)),
          tint: (l) => mixColor(VITAE_COLORS.white, VITAE_COLORS.spring, l),
        },
      });
    }
    for (let index = 0; index < VITAE_PETALS; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = r * (3.5 + random() * 6);
      const size = r * (0.16 + random() * 0.18);
      const spin = (random() - 0.5) * 14;
      const sway = random() * Math.PI * 2;
      const tone = random();
      this.sparks.add({
        texture: index % 4 === 0 ? frames.blossom : frames.petal,
        spawn: {
          x: Math.cos(angle) * r * 0.3,
          y: Math.sin(angle) * r * 0.3,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - r * 1.5,
          drag: 2.2,
          gravity: r * 1.4,
          born: bloom + random() * 0.08,
          life: 1.1 + random() * 0.8,
        },
        look: {
          size: () => size,
          height: (l) => size * (0.45 + 0.55 * Math.abs(Math.cos(l * 9 + sway))),
          alpha: (l) => Math.min(l * 10, 1) * (1 - phase(l, 0.65, 1)),
          tint: (l) =>
            mixColor(
              tone < 0.45
                ? VITAE_COLORS.emerald
                : tone < 0.7
                  ? VITAE_COLORS.leaf
                  : tone < 0.85
                    ? VITAE_COLORS.spring
                    : VITAE_COLORS.blossom,
              VITAE_COLORS.white,
              (1 - l) * 0.3,
            ),
          rotation: (age) => sway + age * spin,
          drift: (age) => ({ x: Math.sin(age * 3 + sway) * r * 0.25, y: 0 }),
        },
      });
    }
    for (let index = 0; index < VITAE_POLLEN; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = r * (0.4 + random() * 1.6);
      const size = r * (0.05 + random() * 0.07);
      const flicker = random() * 10;
      this.sparks.add({
        texture: frames.spark,
        spawn: {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance * 0.6,
          vx: 0,
          vy: -r * (0.5 + random() * 0.7),
          drag: 0,
          gravity: 0,
          born: VITAE_PHASES.settle * seconds - 0.3 + random() * 0.6,
          life: 0.9 + random() * 0.6,
        },
        look: {
          size: () => size,
          alpha: (l, age) => Math.sin(Math.PI * l) * (0.6 + 0.4 * Math.sin(age * 18 + flicker)),
          tint: (l) => mixColor(VITAE_COLORS.spring, VITAE_COLORS.leaf, l),
          drift: (age) => ({ x: Math.sin(age * 3 + flicker) * r * 0.15, y: 0 }),
        },
      });
    }
  }
}
