import { ColorMatrixFilter, Container, Graphics, Sprite } from "pixi.js";
import { BulgePinchFilter, TwistFilter } from "pixi-filters";

import { paintFalloff, paintGlow } from "@/modules/arena/services/arenaFxScreen";
import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  ARENA_FX_FADE_FROM,
  easeOutBack,
  groupShape,
  mixColor,
  mixStops,
  phase,
  type IArenaFxField,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

/** The screen part is drawn around the target: it follows it on the screen and with the zoom. */
const HERE: IArenaPoint2 = { x: 0, y: 0 };

import {
  ENTROPIA_ASH,
  ENTROPIA_BITE_SPARKS,
  ENTROPIA_CHAINS,
  ENTROPIA_COLORS,
  ENTROPIA_DISK,
  ENTROPIA_DRAIN_MATRIX,
  ENTROPIA_DURATION_MS,
  ENTROPIA_FRAGMENTS,
  ENTROPIA_GROUP_GROWTH,
  ENTROPIA_GROUP_MAX,
  ENTROPIA_HOLE_LIFT,
  ENTROPIA_IDENTITY_MATRIX,
  ENTROPIA_INFALL,
  ENTROPIA_LINK_PX,
  ENTROPIA_PHASES,
  ENTROPIA_RUNE_RING,
  ENTROPIA_RUNES,
  ENTROPIA_THROW_SPAN,
} from "../../arenaEntropiaEffect.constants";
import type { IEntropiaChain, IEntropiaScreen } from "../../arenaEntropiaEffect.types";
import { chainLinks, chainOrigins, spiralIn } from "../../arenaEntropiaEffect.utils";

/**
 * The screen part of "Entropia e Poema": the world drains into black and red, a black hole opens above the
 * target (a black horizon, a burning photon ring, a faint Einstein ring and an accretion disk passing behind it
 * at the top and in front of it at the bottom) and bends the image of the board around it (it pinches and twists
 * the map and the tokens, like gravity bending light), while streaks of light spiral into it from the whole
 * screen. Chains fly in from beyond the edges and bite the target in a burst of sparks; the poem is written
 * around the hole in runes that ignite one by one, then pulled in, spiraling and stretched, while the chains bow
 * toward the hole. A ring implodes, the hole collapses to a point and bursts: a flash, a red sun, rings, the
 * image springs back, the chains break into flying links, and ash falls while the color returns.
 */
export class EntropiaScreen implements IEntropiaScreen {
  private readonly root = new Container();
  private readonly shade = new Graphics();
  private readonly hole = new Container();
  private readonly halo: Sprite;
  private readonly horizon = new Graphics();
  private readonly photon = new Graphics();
  private readonly diskBack: ArenaFxParticles;
  private readonly diskFront: ArenaFxParticles;
  private readonly runeRing = new Container();
  private readonly runes: Graphics[] = [];
  private readonly runeStarts: IArenaPoint2[] = [];
  private readonly chainLayer = new Container();
  private readonly links: Sprite[][] = [];
  private readonly chains: IEntropiaChain[] = [];
  private readonly rings = new Graphics();
  private readonly nova: Sprite;
  private readonly flash = new Graphics();
  private readonly glints: ArenaFxParticles;
  private readonly debris: ArenaFxParticles;
  private readonly drain = new ColorMatrixFilter();
  private readonly pinch = new BulgePinchFilter({ radius: 1, strength: 0 });
  private readonly twist = new TwistFilter({ radius: 1, angle: 0 });
  private planned = false;
  private grow = 1;
  private middle: IArenaPoint2 = HERE;
  private holeAt: IArenaPoint2 = HERE;
  private size = 1;
  private link = ENTROPIA_LINK_PX;
  private ended = false;

  constructor(
    private readonly host: IArenaFxHost,
    private readonly random: () => number,
    private readonly group?: IArenaPoint2[],
  ) {
    const { width, height } = host.screen.size();
    const diagonal = Math.hypot(width, height);
    this.diskBack = new ArenaFxParticles(diagonal, "add");
    this.diskFront = new ArenaFxParticles(diagonal, "add");
    this.glints = new ArenaFxParticles(diagonal, "add");
    this.debris = new ArenaFxParticles(diagonal, "normal");
    this.halo = new Sprite(host.textures.glow);
    this.halo.anchor.set(0.5);
    this.halo.tint = ENTROPIA_COLORS.crimson;
    this.halo.blendMode = "add";
    this.nova = new Sprite(host.textures.glow);
    this.nova.anchor.set(0.5);
    this.nova.blendMode = "add";
    this.nova.visible = false;
    this.photon.blendMode = "add";
    this.rings.blendMode = "add";
    this.flash.blendMode = "add";
    this.hole.addChild(
      this.halo,
      this.diskBack.container,
      this.horizon,
      this.diskFront.container,
      this.photon,
    );
    this.hole.visible = false;
    this.buildRunes();
    this.root.addChild(
      this.shade,
      this.glints.container,
      this.hole,
      this.runeRing,
      this.chainLayer,
      this.debris.container,
      this.rings,
      this.nova,
      this.flash,
    );
    host.screen.layer.addChild(this.root);
    this.pinch.resolution = 1;
    this.twist.resolution = 1;
  }

  step(t: number, origin: Container, r: number): void {
    this.host.screen.fitWorldFilters();
    const anchor = this.host.screen.toScreen(origin);
    const { width, height } = this.host.screen.size();
    if (!this.planned) {
      this.planned = true;
      this.host.screen.addWorldFilter(this.drain);
      this.host.screen.addWorldFilter(this.twist);
      this.host.screen.addWorldFilter(this.pinch);
      this.size = r;
      this.link = Math.min(ENTROPIA_LINK_PX, r * 0.6);
      const shape = groupShape(this.group);
      this.grow = Math.min(Math.max(shape.spread * ENTROPIA_GROUP_GROWTH, 1), ENTROPIA_GROUP_MAX);
      this.middle = { x: shape.center.x * r, y: shape.center.y * r };
      this.holeAt = { x: this.middle.x, y: this.middle.y - r * ENTROPIA_HOLE_LIFT * this.grow };
      const targets = (this.group ?? [HERE]).map((point) => ({ x: point.x * r, y: point.y * r }));
      const field = this.host.screen.field();
      const local = { ...field, x: field.x - anchor.x, y: field.y - anchor.y };
      this.plan(this.middle, this.holeAt, targets, local, r);
    }
    const zoom = r / this.size;
    const screenHole = { x: anchor.x + this.holeAt.x * zoom, y: anchor.y + this.holeAt.y * zoom };
    this.bend(t, screenHole, width, height, r * this.grow);
    this.root.position.set(anchor.x, anchor.y);
    this.root.scale.set(zoom);
    this.root.alpha = 1 - phase(t, ARENA_FX_FADE_FROM, 1);
    const center = this.middle;
    const size = this.size * this.grow;
    const hole = this.holeAt;
    const seconds = (t * ENTROPIA_DURATION_MS) / 1000;
    const dark = phase(t, 0, ENTROPIA_PHASES.dark) * (1 - phase(t, ENTROPIA_PHASES.settle, 1));
    this.drain.matrix = ENTROPIA_IDENTITY_MATRIX.map(
      (value, index) => value + ((ENTROPIA_DRAIN_MATRIX[index] ?? 0) - value) * 0.85 * dark,
    ) as ColorMatrixFilter["matrix"];
    this.shade.position.set(hole.x, hole.y);
    this.shade.alpha = dark;
    this.placeHole(t, seconds, hole, size);
    this.placeRunes(t, seconds, hole, size);
    this.placeChains(t, seconds, center, hole);
    this.drawRings(t, hole, size);
    this.diskBack.update(seconds);
    this.diskFront.update(seconds);
    this.glints.update(seconds);
    this.debris.update(seconds);
  }

  end(): void {
    if (this.ended) return;
    this.ended = true;
    for (const filter of [this.drain, this.twist, this.pinch]) {
      this.host.screen.removeWorldFilter(filter);
      filter.destroy();
    }
    this.root.destroy({ children: true });
  }

  /**
   * Gravity on the image of the board: it is pinched toward the hole and twisted around it more and more
   * while it pulls, hardest as it collapses; at the burst it springs out and settles.
   */
  private bend(t: number, hole: IArenaPoint2, width: number, height: number, r: number): void {
    const grip =
      0.25 * phase(t, ENTROPIA_PHASES.form, ENTROPIA_PHASES.pull) +
      0.75 * phase(t, ENTROPIA_PHASES.pull, ENTROPIA_PHASES.collapse) ** 1.5;
    const burst = phase(t, ENTROPIA_PHASES.burst, ENTROPIA_PHASES.settle);
    const before = t < ENTROPIA_PHASES.burst;
    const spring = before ? 0 : Math.sin(Math.PI * Math.min(burst * 1.6, 1)) * (1 - burst);
    this.pinch.centerX = hole.x / Math.max(width, 1);
    this.pinch.centerY = hole.y / Math.max(height, 1);
    this.pinch.radius = r * (3.5 + 3.5 * (before ? grip : 1 - burst));
    this.pinch.strength = before ? -0.82 * grip : 0.55 * spring;
    this.twist.offset = { x: hole.x, y: hole.y };
    this.twist.radius = r * (3 + 3 * grip);
    this.twist.angle = before ? 1.6 * grip : -0.6 * spring;
  }

  /**
   * The black hole: it opens out of nothing, its disk turning and its rings burning, grows while it pulls,
   * shrinks to a point as it collapses and is gone at the burst.
   */
  private placeHole(t: number, seconds: number, hole: IArenaPoint2, r: number): void {
    const open = easeOutBack(phase(t, ENTROPIA_PHASES.form, ENTROPIA_PHASES.bind + 0.04));
    const grow = phase(t, ENTROPIA_PHASES.bind, ENTROPIA_PHASES.collapse);
    const collapse = phase(t, ENTROPIA_PHASES.collapse, ENTROPIA_PHASES.burst);
    const size = Math.max(open, 0) * (1 + 0.45 * grow) * (1 - collapse ** 0.6);
    this.hole.visible = size > 0.01 && t < ENTROPIA_PHASES.burst;
    if (!this.hole.visible) return;
    this.hole.position.set(hole.x, hole.y);
    this.hole.scale.set(size);
    this.photon.rotation = seconds * 0.8;
    this.halo.width = this.halo.height = r * 5.5;
    this.halo.alpha = 0.55 + 0.25 * Math.sin(seconds * 7) + 0.4 * collapse;
  }

  /** The runes of the poem, each drawn once in white (tinted while it plays): a wide soft stroke and a core. */
  private buildRunes(): void {
    for (let index = 0; index < ENTROPIA_RUNE_RING; index += 1) {
      const shape = ENTROPIA_RUNES[index % ENTROPIA_RUNES.length] ?? [];
      const g = new Graphics();
      for (const stroke of shape)
        g.poly([...stroke], false).stroke({
          width: 0.22,
          color: ENTROPIA_COLORS.white,
          alpha: 0.35,
          cap: "round",
          join: "round",
        });
      for (const stroke of shape)
        g.poly([...stroke], false).stroke({
          width: 0.08,
          color: ENTROPIA_COLORS.white,
          cap: "round",
          join: "round",
        });
      g.blendMode = "add";
      g.visible = false;
      this.runes.push(g);
      this.runeRing.addChild(g);
    }
  }

  /**
   * The poem: the runes ignite one by one in a ring around the hole (white-hot as each is written, then
   * burning red), the ring turning slowly; then they are pulled in one after the other, spiraling, stretched
   * along their way and going out.
   */
  private placeRunes(t: number, seconds: number, hole: IArenaPoint2, r: number): void {
    const count = this.runes.length;
    const turn = seconds * 0.35;
    this.runes.forEach((rune, index) => {
      const start = this.runeStarts[index];
      if (!start) return;
      const write = ENTROPIA_PHASES.poem + (index / count) * 0.14;
      const lit = phase(t, write, write + 0.025);
      const pull = phase(t, ENTROPIA_PHASES.pull + (index / count) * 0.1, ENTROPIA_PHASES.collapse);
      rune.visible = lit > 0 && pull < 1;
      if (!rune.visible) return;
      const angle = Math.atan2(start.y, start.x) + turn;
      const radius = Math.hypot(start.x, start.y);
      const ringPoint = {
        x: hole.x + Math.cos(angle) * radius,
        y: hole.y + Math.sin(angle) * radius,
      };
      const path = spiralIn(ringPoint, hole, pull, 0.9);
      const size = r * 0.95 * (0.6 + 0.4 * easeOutBack(lit)) * (1 - pull * 0.5);
      rune.position.set(path.point.x, path.point.y);
      rune.rotation = pull > 0 ? path.angle : angle + Math.PI / 2;
      rune.scale.set(size / path.stretch ** 0.5, size * path.stretch * (1 - pull * 0.4));
      const hot = 1 - phase(t, write + 0.02, write + 0.1);
      rune.tint = mixStops(
        [ENTROPIA_COLORS.crimson, ENTROPIA_COLORS.ruby, ENTROPIA_COLORS.hot, ENTROPIA_COLORS.white],
        Math.min(0.35 + 0.65 * hot + 0.4 * pull + 0.1 * Math.sin(seconds * 6 + index), 1),
      );
      rune.alpha = lit * (1 - pull ** 3);
    });
  }

  /**
   * The chains: thrown one after the other from beyond the edges, flying in a bow and landing on the target,
   * rattling as they bite; while the hole pulls they bow toward it and the links near the target glow red-hot;
   * at the burst they are gone (their links fly as debris).
   */
  private placeChains(t: number, seconds: number, center: IArenaPoint2, hole: IArenaPoint2): void {
    const pull = phase(t, ENTROPIA_PHASES.pull, ENTROPIA_PHASES.collapse);
    const visible = t >= ENTROPIA_PHASES.bind && t < ENTROPIA_PHASES.burst;
    this.chainLayer.visible = visible;
    if (!visible) return;
    const bind = phase(t, ENTROPIA_PHASES.bind, ENTROPIA_PHASES.poem + 0.06);
    this.chains.forEach((chain, chainIndex) => {
      const sprites = this.links[chainIndex] ?? [];
      const thrown = phase(bind, chain.delay, chain.delay + ENTROPIA_THROW_SPAN);
      const reach = 1 - (1 - thrown) ** 3;
      const from = { x: center.x + chain.from.x, y: center.y + chain.from.y };
      const to = chain.to;
      const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
      const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
      const normal = { x: -(to.y - from.y) / length, y: (to.x - from.x) / length };
      const bite =
        phase(thrown, 0.9, 1) * (1 - phase(t, ENTROPIA_PHASES.poem + 0.1, ENTROPIA_PHASES.pull));
      const sway =
        chain.bow * (1 - reach * 0.7) + Math.sin(seconds * 30 + chainIndex) * chain.rattle * bite;
      const control = {
        x: middle.x + normal.x * length * sway + (hole.x - middle.x) * pull * 0.7,
        y: middle.y + normal.y * length * sway + (hole.y - middle.y) * pull * 0.7,
      };
      const links = reach > 0 ? chainLinks(from, control, to, this.link, reach) : [];
      sprites.forEach((sprite, index) => {
        const link = links[index];
        sprite.visible = link !== undefined;
        if (!link) return;
        const near = index / Math.max(links.length, 1);
        const hot = Math.max(phase(near, 0.6, 1) * (0.5 + 0.5 * pull), pull * 0.6);
        sprite.position.set(link.point.x, link.point.y);
        sprite.rotation = link.angle + Math.PI / 2;
        const edge = index % 2 === 1;
        sprite.width = this.link * (edge ? 0.32 : 0.95);
        sprite.height = this.link * 1.35;
        sprite.tint = mixStops(
          [
            ENTROPIA_COLORS.iron,
            ENTROPIA_COLORS.rust,
            ENTROPIA_COLORS.crimson,
            ENTROPIA_COLORS.ember,
          ],
          Math.min(hot + 0.15 * Math.sin(seconds * 12 + index), 1),
        );
      });
    });
  }

  /**
   * Rings: one implodes onto the hole as it collapses; at the burst a flash, a red sun swelling and fading,
   * and rings racing out from where the hole was.
   */
  private drawRings(t: number, hole: IArenaPoint2, r: number): void {
    const g = this.rings.clear();
    const implode = phase(t, ENTROPIA_PHASES.collapse - 0.04, ENTROPIA_PHASES.burst);
    if (implode > 0 && implode < 1) {
      const radius = r * 7 * (1 - implode ** 1.5);
      g.circle(hole.x, hole.y, radius).stroke({
        width: r * 0.25 * implode + 1,
        color: ENTROPIA_COLORS.crimson,
        alpha: 0.6 * implode,
      });
      g.circle(hole.x, hole.y, radius).stroke({
        width: Math.max(r * 0.05, 1),
        color: ENTROPIA_COLORS.hot,
        alpha: implode,
      });
    }
    const flash =
      t >= ENTROPIA_PHASES.burst
        ? 1 - phase(t, ENTROPIA_PHASES.burst, ENTROPIA_PHASES.burst + 0.05)
        : 0;
    this.flash.alpha = 0.7 * flash;
    const since = phase(t, ENTROPIA_PHASES.burst, ENTROPIA_PHASES.settle + 0.06);
    this.nova.visible = since > 0 && since < 1;
    if (this.nova.visible) {
      this.nova.position.set(hole.x, hole.y);
      this.nova.width = this.nova.height = r * (3 + 16 * since ** 0.5);
      this.nova.alpha = (1 - since) ** 1.5;
      this.nova.tint = mixColor(ENTROPIA_COLORS.white, ENTROPIA_COLORS.crimson, since ** 0.5);
    }
    if (since <= 0 || since >= 1) return;
    for (const [delay, strength] of [
      [0, 1],
      [0.12, 0.7],
      [0.26, 0.45],
    ] as const) {
      const life = phase(since, delay, delay + 0.6);
      if (life <= 0 || life >= 1) continue;
      const radius = r * (1 + 14 * life ** 0.6);
      g.circle(hole.x, hole.y, radius).stroke({
        width: r * 0.35 * (1 - life) * strength + 1,
        color: ENTROPIA_COLORS.crimson,
        alpha: 0.5 * (1 - life),
      });
      g.circle(hole.x, hole.y, radius).stroke({
        width: Math.max(r * 0.06 * (1 - life), 1),
        color: ENTROPIA_COLORS.white,
        alpha: (1 - life) * strength,
      });
    }
  }

  /**
   * Plans what is drawn once (the darkness with its opening, the horizon, the rings of light and the flash),
   * the chains and their link sprites, where the runes sit, the accretion disk, the light spiraling in, the
   * sparks where the chains bite and the debris of the burst.
   */
  private plan(
    center: IArenaPoint2,
    hole: IArenaPoint2,
    targets: IArenaPoint2[],
    field: IArenaFxField,
    r: number,
  ): void {
    const big = r * this.grow;
    const random = this.random;
    const frames = this.host.textures;
    const seconds = ENTROPIA_DURATION_MS / 1000;
    const lowered = big * ENTROPIA_HOLE_LIFT * 0.5;
    paintFalloff(this.shade, 0, lowered, big * 6, field.diagonal * 1.1, ENTROPIA_COLORS.void, 0.62);
    this.shade
      .circle(0, lowered, big * 6)
      .stroke({ width: big * 0.12, color: ENTROPIA_COLORS.blood, alpha: 0.5 });
    this.shade.alpha = 0;
    this.horizon.circle(0, 0, big * 0.9).fill({ color: ENTROPIA_COLORS.black });
    this.horizon
      .circle(0, 0, big * 0.9)
      .stroke({ width: big * 0.05, color: ENTROPIA_COLORS.blood });
    this.photon
      .circle(0, 0, big * 1.02)
      .stroke({ width: big * 0.1, color: ENTROPIA_COLORS.crimson, alpha: 0.9 })
      .circle(0, 0, big * 1.0)
      .stroke({ width: big * 0.03, color: ENTROPIA_COLORS.white, alpha: 0.95 })
      .arc(0, 0, big * 1.12, -0.4, 1.2)
      .stroke({ width: big * 0.05, color: ENTROPIA_COLORS.hot, alpha: 0.7 })
      .circle(0, 0, big * 1.45)
      .stroke({ width: big * 0.025, color: ENTROPIA_COLORS.hot, alpha: 0.35 })
      .arc(0, 0, big * 1.45, 2.2, 3.4)
      .stroke({ width: big * 0.05, color: ENTROPIA_COLORS.white, alpha: 0.3 });
    paintGlow(this.flash, hole.x, hole.y, field.diagonal, ENTROPIA_COLORS.hot);
    this.flash.alpha = 0;
    for (let index = 0; index < this.runes.length; index += 1) {
      const angle = (index / this.runes.length) * Math.PI * 2 - Math.PI / 2;
      const radius = big * 4.2;
      this.runeStarts.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    const origins = chainOrigins(ENTROPIA_CHAINS, field.width, field.height, random);
    const bindStart = ENTROPIA_PHASES.bind * seconds;
    const bindSpan = (ENTROPIA_PHASES.poem + 0.06 - ENTROPIA_PHASES.bind) * seconds;
    origins.forEach((from, index) => {
      const chain: IEntropiaChain = {
        from,
        to: targets[index % targets.length] ?? center,
        delay: (index / ENTROPIA_CHAINS) * 0.5 + random() * 0.05,
        bow: (random() - 0.5) * 0.5,
        rattle: 0.02 + random() * 0.03,
      };
      this.chains.push(chain);
      const count = Math.ceil((Math.hypot(from.x, from.y) * 1.3) / this.link) + 2;
      const sprites: Sprite[] = [];
      for (let link = 0; link < count; link += 1) {
        const sprite = new Sprite(frames.link);
        sprite.anchor.set(0.5);
        sprite.visible = false;
        sprites.push(sprite);
        this.chainLayer.addChild(sprite);
      }
      this.links.push(sprites);
      this.planBite(chain.to, from, bindStart + (chain.delay + ENTROPIA_THROW_SPAN) * bindSpan, r);
    });
    this.planDisk(big, seconds);
    this.planInfall(hole, field, seconds, r);
    this.planDebris(center, field, r, seconds, origins);
  }

  /** Sparks where a chain bites the target, thrown back along it. */
  private planBite(center: IArenaPoint2, from: IArenaPoint2, at: number, r: number): void {
    const random = this.random;
    const back = Math.atan2(from.y, from.x);
    for (let index = 0; index < ENTROPIA_BITE_SPARKS; index += 1) {
      const angle = back + (random() - 0.5) * 1.6;
      const speed = r * (3 + random() * 5);
      const size = r * (0.22 + random() * 0.22);
      this.glints.add({
        texture: this.host.textures.streak,
        anchorX: 1,
        spawn: {
          x: center.x,
          y: center.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          drag: 4,
          gravity: r * 3,
          born: at,
          life: 0.3 + random() * 0.2,
        },
        look: {
          size: (l) => size * 2.5 * (1 - l),
          height: () => size * 0.4,
          alpha: (l) => 1 - l,
          tint: (l) => mixColor(ENTROPIA_COLORS.white, ENTROPIA_COLORS.ember, l),
          rotation: (_, velocity) => Math.atan2(velocity.y, velocity.x),
        },
      });
    }
  }

  /**
   * The accretion disk: hot matter turning around the hole on a tilted ring, white inside, red outside, brighter
   * on the side coming at the viewer; each grain is drawn behind the horizon on the far half and in front of it
   * on the near half.
   */
  private planDisk(r: number, seconds: number): void {
    const random = this.random;
    const frames = this.host.textures;
    const from = ENTROPIA_PHASES.form * seconds;
    const until = ENTROPIA_PHASES.collapse * seconds;
    for (let index = 0; index < ENTROPIA_DISK; index += 1) {
      const angle = random() * Math.PI * 2;
      const band = random();
      const radius = r * (1.15 + band * 1.6);
      const speed = 3.2 - band * 1.8;
      const size = r * (0.14 + random() * 0.2) * (1 - band * 0.4);
      const life = 0.8 + random() * 0.8;
      const born = from + random() * Math.max(until - from - life * 0.5, 0.1);
      const streak = index % 4 === 0;
      const color = mixStops(
        [
          ENTROPIA_COLORS.white,
          ENTROPIA_COLORS.hot,
          ENTROPIA_COLORS.ember,
          ENTROPIA_COLORS.crimson,
        ],
        band,
      );
      for (const [particles, near] of [
        [this.diskBack, false],
        [this.diskFront, true],
      ] as const) {
        particles.add({
          texture: streak ? frames.streak : frames.glow,
          spawn: { x: 0, y: 0, vx: 0, vy: 0, drag: 0, gravity: 0, born, life },
          look: {
            size: (l) => size * (streak ? 2.4 : 1) * (1 - l * 0.3),
            height: streak ? () => size * 0.5 : undefined,
            alpha: (l, age) => {
              const turn = angle + age * speed;
              if (Math.sin(turn) >= 0 !== near) return 0;
              return Math.sin(Math.PI * l) * (0.55 + 0.45 * Math.cos(turn));
            },
            tint: () => color,
            rotation: (age) => angle + age * speed + Math.PI / 2,
            drift: (age) => {
              const turn = angle + age * speed;
              const inward = 1 - Math.min(age / life, 1) * 0.35;
              return {
                x: Math.cos(turn) * radius * inward,
                y: Math.sin(turn) * radius * 0.3 * inward,
              };
            },
          },
        });
      }
    }
  }

  /** Light from the whole screen bent into the hole: streaks spiraling in, faster as they near it. */
  private planInfall(hole: IArenaPoint2, field: IArenaFxField, seconds: number, r: number): void {
    const random = this.random;
    const from = ENTROPIA_PHASES.bind * seconds;
    const until = (ENTROPIA_PHASES.collapse - 0.02) * seconds;
    for (let index = 0; index < ENTROPIA_INFALL; index += 1) {
      const start = { x: field.x + random() * field.width, y: field.y + random() * field.height };
      const life = 0.7 + random() * 0.6;
      const swirl = (random() > 0.5 ? 1 : -1) * (0.8 + random() * 0.8);
      const size = r * (0.3 + random() * 0.4);
      const distance = Math.hypot(start.x - hole.x, start.y - hole.y);
      const base = Math.atan2(start.y - hole.y, start.x - hole.x);
      this.glints.add({
        texture: this.host.textures.streak,
        anchorX: 1,
        spawn: {
          x: hole.x,
          y: hole.y,
          vx: 0,
          vy: 0,
          drag: 0,
          gravity: 0,
          born: from + random() * Math.max(until - from - life, 0.1),
          life,
        },
        look: {
          size: (l) => size * (1 + 3 * l),
          height: () => size * 0.25,
          alpha: (l) => Math.min(l * 4, 1) * (1 - phase(l, 0.85, 1)) * 0.8,
          tint: (l) => mixColor(ENTROPIA_COLORS.crimson, ENTROPIA_COLORS.hot, l),
          rotation: (age) => base + swirl * (age / life) ** 2 * Math.PI + Math.PI,
          drift: (age) => {
            const share = Math.min(age / life, 1);
            const turn = base + swirl * share ** 2 * Math.PI;
            const reach = distance * (1 - share ** 1.4);
            return { x: Math.cos(turn) * reach, y: Math.sin(turn) * reach };
          },
        },
      });
    }
  }

  /** The burst: links of the broken chains flying out, embers, and ash falling slowly over the screen. */
  private planDebris(
    center: IArenaPoint2,
    field: IArenaFxField,
    r: number,
    seconds: number,
    origins: IArenaPoint2[],
  ): void {
    const random = this.random;
    const frames = this.host.textures;
    const burst = ENTROPIA_PHASES.burst * seconds;
    for (let index = 0; index < ENTROPIA_FRAGMENTS; index += 1) {
      const origin = origins[index % origins.length] ?? { x: 0, y: -1 };
      const along = 0.05 + random() * 0.45;
      const start = { x: center.x + origin.x * along, y: center.y + origin.y * along };
      const out = Math.atan2(start.y - center.y, start.x - center.x) + (random() - 0.5) * 1.4;
      const speed = r * (5 + random() * 9);
      const size = this.link * (0.8 + random() * 0.6);
      const spin = (random() - 0.5) * 16;
      const ember = index % 3 === 0;
      this.debris.add({
        texture: ember ? frames.spark : frames.link,
        spawn: {
          ...start,
          vx: Math.cos(out) * speed,
          vy: Math.sin(out) * speed,
          drag: 1.8,
          gravity: r * 4,
          born: burst + random() * 0.05,
          life: 0.9 + random() * 0.6,
        },
        look: {
          size: () => (ember ? size * 0.6 : size * 0.7),
          height: ember ? undefined : () => size,
          alpha: (l) => 1 - phase(l, 0.6, 1),
          tint: (l) =>
            ember
              ? mixColor(ENTROPIA_COLORS.hot, ENTROPIA_COLORS.crimson, l)
              : mixColor(ENTROPIA_COLORS.ember, ENTROPIA_COLORS.iron, Math.min(l * 3, 1)),
          rotation: (age) => out + age * spin,
        },
      });
    }
    const fall = burst + 0.2;
    for (let index = 0; index < ENTROPIA_ASH; index += 1) {
      const size = r * (0.18 + random() * 0.3);
      const sway = random() * Math.PI * 2;
      const life = 1.2 + random() * 0.8;
      this.debris.add({
        texture: index % 2 === 0 ? frames.smoke : frames.spark,
        spawn: {
          x: field.x + random() * field.width,
          y: field.y - r * 0.6 - random() * field.height * 0.3,
          vx: 0,
          vy: field.height * (0.2 + random() * 0.15),
          drag: 0,
          gravity: 0,
          born: fall + random() * 0.6,
          life,
        },
        look: {
          size: () => size,
          alpha: (l) => Math.sin(Math.PI * l) * 0.7,
          tint: (l) =>
            mixColor(
              index % 2 === 0 ? ENTROPIA_COLORS.ash : ENTROPIA_COLORS.ember,
              ENTROPIA_COLORS.ash,
              l,
            ),
          drift: (age) => ({ x: Math.sin(age * 2 + sway) * r * 0.9, y: 0 }),
        },
      });
    }
  }
}
