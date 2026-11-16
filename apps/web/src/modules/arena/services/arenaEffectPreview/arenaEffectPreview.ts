import { Application, Container, Graphics, Text } from "pixi.js";

import {
  ArenaShockwaves,
  createAttackerEffect,
  createTargetEffect,
} from "@/modules/arena/services/arenaEffectPlayers";
import { ArenaFxTextures } from "@/modules/arena/services/arenaFxTextures";
import type { IArenaEffectPlayer, IArenaFxHost } from "@/modules/arena/services/arenaTokenEffects";

import {
  PREVIEW_ATTACKER_X,
  PREVIEW_COLORS,
  PREVIEW_PAUSE_MS,
  PREVIEW_SAMPLE_AMOUNT,
  PREVIEW_TARGET_X,
  PREVIEW_TOKEN_SIZE,
} from "./arenaEffectPreview.constants";
import type {
  IArenaEffectPreviewOptions,
  IArenaEffectPreviewPlay,
} from "./arenaEffectPreview.types";

interface IPreviewToken {
  container: Container;
  home: { x: number; y: number };
  effects: IArenaEffectPlayer[];
}

/**
 * A small stage that loops one animation on two sample tokens (attacker and target), with the very same
 * effects of the board, to show what each one looks like before choosing it.
 */
export class ArenaEffectPreview {
  private readonly ground = new Graphics();
  private readonly attacker: IPreviewToken;
  private readonly target: IPreviewToken;
  private readonly textures = new ArenaFxTextures();
  private readonly shockwaves: ArenaShockwaves;
  private readonly host: IArenaFxHost;
  private current: IArenaEffectPreviewPlay | null = null;
  private restartAt = 0;
  private seed = 1;
  private resume = 0;
  private looping = true;

  private constructor(
    private readonly app: Application,
    private readonly options: IArenaEffectPreviewOptions,
  ) {
    this.shockwaves = new ArenaShockwaves(app);
    this.host = { textures: this.textures.frames, shockwave: this.shockwaves.add };
    app.stage.addChild(this.ground);
    this.attacker = this.token("A", PREVIEW_COLORS.ruby, PREVIEW_ATTACKER_X);
    this.target = this.token("B", PREVIEW_COLORS.teal, PREVIEW_TARGET_X);
    this.drawGround();
    if (options.lite) app.ticker.maxFPS = 30;
    app.ticker.add(this.tick);
    app.ticker.stop();
  }

  /**
   * Creates the preview inside `host` (throws when WebGL is not available).
   */
  static async create(
    host: HTMLElement,
    options: IArenaEffectPreviewOptions,
  ): Promise<ArenaEffectPreview> {
    const app = new Application();
    await app.init({
      width: Math.max(host.clientWidth, 1),
      height: Math.max(host.clientHeight, 1),
      background: PREVIEW_COLORS.ground,
      antialias: !options.lite,
      resolution: options.lite ? 1 : Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: "webgl",
    });
    app.canvas.style.display = "block";
    app.canvas.setAttribute("aria-hidden", "true");
    host.appendChild(app.canvas);
    return new ArenaEffectPreview(app, options);
  }

  /**
   * Repeats the animation after each play, or stops after the current one (paused, or reduced motion).
   */
  setLooping(looping: boolean): void {
    this.looping = looping;
    if (looping && this.restartAt === 0 && !this.app.ticker.started) this.app.ticker.start();
  }

  /** Plays this animation now (and keeps repeating it while looping). */
  play(next: IArenaEffectPreviewPlay): void {
    window.clearTimeout(this.resume);
    this.current = next;
    this.restartAt = 0;
    this.clear(this.attacker);
    this.clear(this.target);
    this.app.ticker.start();
  }

  destroy(): void {
    window.clearTimeout(this.resume);
    this.app.ticker.remove(this.tick);
    this.clear(this.attacker);
    this.clear(this.target);
    this.shockwaves.destroy();
    this.textures.destroy();
    this.app.destroy({ removeView: true }, { children: true });
  }

  private token(initial: string, ring: number, share: number): IPreviewToken {
    const container = new Container();
    const radius = PREVIEW_TOKEN_SIZE / 2;
    const shape = new Graphics()
      .circle(0, PREVIEW_TOKEN_SIZE * 0.05, radius + 2)
      .fill({ color: 0x000000, alpha: 0.45 })
      .circle(0, 0, radius)
      .fill({ color: PREVIEW_COLORS.base })
      .circle(0, 0, radius)
      .stroke({ width: 3, color: ring });
    const letter = new Text({
      text: initial,
      style: { fontFamily: this.options.fontFamily, fontSize: 28, fill: PREVIEW_COLORS.initial },
    });
    letter.anchor.set(0.5);
    container.addChild(shape, letter);
    const home = { x: this.app.screen.width * share, y: this.app.screen.height * 0.58 };
    container.position.set(home.x, home.y);
    this.app.stage.addChild(container);
    return { container, home, effects: [] };
  }

  private drawGround(): void {
    const { width, height } = this.app.screen;
    const g = this.ground.clear();
    for (let x = 0; x <= width; x += 32) g.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y <= height; y += 32) g.moveTo(0, y).lineTo(width, y);
    g.stroke({ width: 1, color: PREVIEW_COLORS.grid, alpha: 0.6 });
  }

  private clear(token: IPreviewToken): void {
    for (const effect of token.effects) effect.destroy();
    token.effects = [];
    token.container.filters = null;
    token.container.position.set(token.home.x, token.home.y);
    token.container.scale.set(1);
  }

  private start(play: IArenaEffectPreviewPlay): void {
    const seed = this.seed++;
    let delayMs = 0;
    if (play.withAttacker && !this.options.lite) {
      const attack = createAttackerEffect(
        {
          style: play.style,
          size: PREVIEW_TOKEN_SIZE,
          toward: {
            x: this.target.home.x - this.attacker.home.x,
            y: this.target.home.y - this.attacker.home.y,
          },
          targetRadius: PREVIEW_TOKEN_SIZE / 2,
          seed,
        },
        this.host,
      );
      this.attacker.effects.push(attack.effect);
      if (attack.flies) this.attacker.container.addChildAt(attack.effect.container, 0);
      else this.attacker.container.addChild(attack.effect.container);
      this.app.stage.addChild(this.attacker.container);
      delayMs = attack.hitMs;
    }
    const effect = createTargetEffect(
      {
        kind: play.kind,
        resource: play.resource,
        amount: PREVIEW_SAMPLE_AMOUNT,
        size: PREVIEW_TOKEN_SIZE,
        fontFamily: this.options.fontFamily,
        lite: this.options.lite,
        seed: seed + 1000,
        delayMs,
        style: play.style,
      },
      this.host,
    );
    this.target.effects.push(effect);
    this.target.container.addChild(effect.container);
    this.restartAt = Number.POSITIVE_INFINITY;
  }

  private stepToken(token: IPreviewToken, now: number): boolean {
    let dx = 0;
    let dy = 0;
    let scaleX = 1;
    let scaleY = 1;
    token.effects = token.effects.filter((effect) => {
      const { done, frame } = effect.step(now, 1, 0);
      if (done) {
        effect.destroy();
        return false;
      }
      dx += frame.dx;
      dy += frame.dy;
      scaleX *= frame.scaleX;
      scaleY *= frame.scaleY;
      return true;
    });
    const filters = token.effects.flatMap((effect) => effect.tokenFilters ?? []);
    const current = token.container.filters ?? [];
    const same =
      filters.length === current.length &&
      filters.every((filter, index) => filter === current[index]);
    if (!same) token.container.filters = filters.length > 0 ? filters : null;
    token.container.position.set(token.home.x + dx, token.home.y + dy);
    token.container.scale.set(scaleX, scaleY);
    return token.effects.length > 0;
  }

  /**
   * Steps the loop; between two plays the ticker stops (no frame drawn during the pause) and starts again after
   * `PREVIEW_PAUSE_MS`, and the light mode runs at 30 fps.
   */
  private tick = (): void => {
    const now = performance.now();
    const play = this.current;
    if (!play) return;
    if (this.restartAt === 0 || now >= this.restartAt) this.start(play);
    const attackerBusy = this.stepToken(this.attacker, now);
    const targetBusy = this.stepToken(this.target, now);
    const busy = attackerBusy || targetBusy;
    const rippling = this.shockwaves.step(now);
    if (!busy && !rippling && this.restartAt === Number.POSITIVE_INFINITY) {
      this.restartAt = 0;
      this.app.ticker.stop();
      this.app.render();
      if (this.looping)
        this.resume = window.setTimeout(() => this.app.ticker.start(), PREVIEW_PAUSE_MS);
    }
  };
}
