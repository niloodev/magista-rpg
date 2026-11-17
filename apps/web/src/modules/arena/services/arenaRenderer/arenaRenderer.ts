import {
  clampToMap,
  type IArenaBounds,
  type IArenaEffect,
  type IArenaPoint,
  type IMoveArenaTokenInput,
} from "@magista/shared";
import {
  Application,
  Circle,
  Container,
  type FederatedPointerEvent,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
} from "pixi.js";

import { fetchMediaBlob } from "@/core/services/http";
import { ARENA_EMPTY_BOUNDS } from "@/modules/arena/arena.constants";
import { ArenaStatusBars } from "@/modules/arena/services/arenaStatusBars";
import { ArenaFxScreen } from "@/modules/arena/services/arenaFxScreen";
import { ArenaFxTextures } from "@/modules/arena/services/arenaFxTextures";
import { ArenaTurnAura } from "@/modules/arena/services/arenaTurnAura";
import {
  ArenaShockwaves,
  createAttackerEffect,
  createTargetEffect,
} from "@/modules/arena/services/arenaEffectPlayers";
import {
  EFFECT_FLOAT_QUIET_MS,
  EFFECT_LINGER_MS,
  EFFECT_MAX_PER_TOKEN,
  EFFECT_RICH_BUDGET,
  effectStyle,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  ARENA_CAMERA_SAVE_DELAY_MS,
  ARENA_CAMERA_STORAGE_PREFIX,
  ARENA_CLICK_SLOP,
  ARENA_FRAME_PADDING,
  ARENA_HANDLE_SIZE,
  RESIZE_CORNERS,
  ARENA_COLORS,
  ARENA_LABEL_GAP,
  ARENA_LABEL_MIN_SCREEN_PX,
  ARENA_LITE_FRAME_MS,
  ARENA_TURN_FRAME_MS,
  ARENA_FLOAT_SHADOW,
  ARENA_SETTLE_DISTANCE,
  ARENA_TOKEN_LERP,
  ARENA_MAP_TEXTURE_MAX,
  ARENA_TOKEN_TEXTURE_SIZE,
  ARENA_FIGURE_TEXTURE_SIZE,
  FIGURE_BRACKET_RATIO,
  ARENA_LABEL_FAINT_ALPHA,
  ARENA_WHEEL_SENSITIVITY,
} from "./arenaRenderer.constants";
import type {
  IArenaCamera,
  IArenaRenderer,
  IArenaRendererOptions,
  IArenaRenderScene,
  IArenaRenderToken,
  ILoadedTexture,
} from "./arenaRenderer.types";
import {
  approach,
  clampZoom,
  labelScale,
  centerCamera,
  fitCamera,
  fitTextureSize,
  distance,
  isEditableTarget,
  isInVisibleArea,
  parseStoredCamera,
  scaleTokenSize,
  screenToWorld,
  tokenExtents,
  tokensInRect,
  groupOffsets,
  unitDirection,
  visibleCenterPoint,
  zoomAt,
} from "./arenaRenderer.utils";

interface ITokenView {
  data: IArenaRenderToken;
  container: Container;
  shadow: Graphics;
  base: Graphics;
  ring: Graphics;
  label: Text;
  portrait: Sprite | null;
  /** Width / height of the loaded image (the shape of an isometric figure). */
  aspect: number | null;
  initial: Text | null;
  mask: Graphics;
  display: IArenaPoint;
  target: IArenaPoint;
  drawnKey: string;
  bars: ArenaStatusBars;
  effects: IArenaEffectPlayer[];
  hovered: boolean;
  /** When the last damage or healing animation started (a status change right after it floats no number). */
  lastEffectAt: number;
  /** A status that arrived before the hit of an incoming attacker; it shows when the hit lands. */
  pendingStatus: IArenaRenderToken["status"] | undefined;
  holdStatusUntil: number;
  /** The turn mark (floating and the energy ring), on the token whose turn it is or fading off the last one. */
  aura: ArenaTurnAura | null;
}

interface IDragState {
  pointerId: number;
  tokenId: string;
  /** Offset of each dragged token from the pointer, in map pixels. */
  offsets: Map<string, IArenaPoint>;
  start: IArenaPoint;
  moves: IMoveArenaTokenInput[];
  moved: boolean;
}

interface IResizeState {
  pointerId: number;
  center: IArenaPoint;
  startDistance: number;
  sizes: Map<string, number>;
}

interface IMarqueeState {
  pointerId: number;
  start: IArenaPoint;
  current: IArenaPoint;
  additive: boolean;
  moved: boolean;
}

interface IPanState {
  pointerId: number;
  start: IArenaPoint;
  camera: IArenaCamera;
  moved: boolean;
  /** A right click: opens the menu of the token under it (or of the map) when it comes up without dragging. */
  menu: boolean;
  menuTokenId: string | null;
}

/**
 * Shift, Ctrl (or Cmd) while clicking adds to or removes from the selection.
 */
function togglesSelection(event: FederatedPointerEvent): boolean {
  return event.shiftKey || event.ctrlKey || event.metaKey;
}

/**
 * Decodes an image from the API into a GPU texture no larger than `maxSize` (old cards stop at 4096), keeping
 * the original size so coordinates stay in pixels of the original image.
 */
async function loadTexture(url: string, maxSize: number): Promise<ILoadedTexture<Texture>> {
  const blob = await fetchMediaBlob(url);
  const original = await createImageBitmap(blob);
  const { width, height } = original;
  const target = fitTextureSize(width, height, maxSize);
  if (!target.scaled) {
    try {
      return { texture: Texture.from(original, true), width, height };
    } catch (error) {
      original.close();
      throw error;
    }
  }
  try {
    const bitmap = await createImageBitmap(blob, {
      resizeWidth: target.width,
      resizeHeight: target.height,
      resizeQuality: "high",
    });
    return { texture: Texture.from(bitmap, true), width, height };
  } finally {
    original.close();
  }
}

/**
 * Decodes a token image straight at its texture size (one decode, the longest side at most `maxSide`): only
 * the proportion matters for a token, never the original size.
 */
async function loadTokenTexture(url: string, maxSide: number): Promise<Texture> {
  const blob = await fetchMediaBlob(url);
  const wide = await createImageBitmap(blob, { resizeWidth: maxSide, resizeQuality: "high" });
  if (wide.height <= maxSide) {
    try {
      return Texture.from(wide, true);
    } catch (error) {
      wide.close();
      throw error;
    }
  }
  try {
    const fitted = await createImageBitmap(wide, {
      resizeWidth: Math.max(1, Math.round((maxSide * wide.width) / wide.height)),
      resizeHeight: maxSide,
      resizeQuality: "high",
    });
    return Texture.from(fitted, true);
  } finally {
    wide.close();
  }
}

/**
 * Destroys a texture and closes the decoded bitmap behind it (Pixi only drops its reference, leaving the
 * memory of a large map until the garbage collector runs).
 */
function destroyTexture(texture: Texture | null | undefined): void {
  if (!texture) return;
  const resource: unknown = texture.source.resource;
  texture.destroy(true);
  if (typeof ImageBitmap !== "undefined" && resource instanceof ImageBitmap) resource.close();
}

/**
 * The Arena board drawn with PixiJS: map, tokens, camera (pan, zoom, pinch) and token dragging.
 * It only redraws when something changes or animates, so an idle board costs no GPU time; the light mode
 * (performance mode) also renders at native resolution without antialias and caps animation at ~30 fps.
 */
export class ArenaRenderer implements IArenaRenderer {
  private readonly world = new Container();
  private readonly mapLayer = new Container();
  private readonly tokenLayer = new Container();
  private readonly tokens = new Map<string, ITokenView>();
  private readonly portraits = new Map<string, Promise<Texture | null>>();
  private fading: { effect: IArenaEffectPlayer; start: number }[] = [];
  private readonly pointers = new Map<number, IArenaPoint>();
  private readonly observer: ResizeObserver;
  private camera: IArenaCamera = { x: 0, y: 0, scale: 1 };
  private bounds: IArenaBounds = ARENA_EMPTY_BOUNDS;
  private sceneId: string | null = null;
  private mapUrl: string | null | undefined = undefined;
  private scene: IArenaRenderScene | null = null;
  private mapTexture: Texture | null = null;
  private readonly uiLayer = new Container();
  private readonly marqueeBox = new Graphics();
  private readonly selectionFrame = new Graphics();
  private readonly handles: Graphics[] = [];
  private resizable = false;
  private insetRight = 0;
  private insetLeft = 0;
  private resize: IResizeState | null = null;
  private selection = new Set<string>();
  private drag: IDragState | null = null;
  private marquee: IMarqueeState | null = null;
  private spaceHeld = false;
  private pan: IPanState | null = null;
  private lastClient: IArenaPoint | null = null;
  private pinch: { distance: number; camera: IArenaCamera } | null = null;
  private frame = 0;
  private lastFrame = 0;
  private saveTimer = 0;
  private sceneVersion = 0;
  private loadingMap = false;
  private destroyed = false;
  private effectSeed = 1;
  private fxTextures: ArenaFxTextures | null = null;
  private shockwaves: ArenaShockwaves | null = null;
  private fxScreen: ArenaFxScreen | null = null;
  private turnTokenId: string | null = null;
  /** A frame was asked from outside the loop (input, data): draw it at once, even while only the aura moves. */
  private urgent = true;
  /** Only the turn aura moved in the last frame, so the loop may run at a calmer pace. */
  private calmAura = false;

  private constructor(
    private readonly app: Application,
    private readonly host: HTMLElement,
    private readonly options: IArenaRendererOptions,
    private readonly maxTextureSize: number,
  ) {
    this.world.addChild(this.mapLayer, this.tokenLayer);
    this.uiLayer.addChild(this.selectionFrame, this.marqueeBox);
    for (const corner of RESIZE_CORNERS) {
      const handle = new Graphics()
        .rect(-ARENA_HANDLE_SIZE / 2, -ARENA_HANDLE_SIZE / 2, ARENA_HANDLE_SIZE, ARENA_HANDLE_SIZE)
        .fill({ color: ARENA_COLORS.gold400 })
        .stroke({ width: 1, color: ARENA_COLORS.black });
      handle.eventMode = "static";
      handle.cursor = corner.cursor;
      handle.visible = false;
      handle.on("pointerdown", this.onHandleDown);
      this.handles.push(handle);
      this.uiLayer.addChild(handle);
    }
    app.stage.addChild(this.world, this.uiLayer);
    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;
    app.stage.on("pointerdown", this.onStageDown);
    app.stage.on("globalpointermove", this.onPointerMove);
    app.stage.on("pointerup", this.onPointerUp);
    app.stage.on("pointerupoutside", this.onPointerUp);
    app.stage.on("pointercancel", this.onPointerCancel);
    app.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    app.canvas.addEventListener("contextmenu", this.preventMenu);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onWindowBlur);
    this.observer = new ResizeObserver(this.onResize);
    this.observer.observe(host);
  }

  /**
   * Creates the WebGL board inside `host` (throws when WebGL is not available).
   */
  static async create(host: HTMLElement, options: IArenaRendererOptions): Promise<ArenaRenderer> {
    const app = new Application();
    const initOptions = {
      width: Math.max(host.clientWidth, 1),
      height: Math.max(host.clientHeight, 1),
      background: ARENA_COLORS.void900,
      antialias: !options.lite,
      resolution: options.lite ? 1 : Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      autoStart: false,
      sharedTicker: false,
      preference: "webgl" as const,
      ...(options.lite ? { powerPreference: "low-power" as const } : {}),
    };
    try {
      await app.init(initOptions);
    } catch (error) {
      app.destroy();
      throw error;
    }
    app.ticker.stop();
    const canvas = app.canvas;
    canvas.style.display = "block";
    canvas.style.touchAction = "none";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);
    const gl = "gl" in app.renderer ? (app.renderer.gl as WebGLRenderingContext) : null;
    const gpuMax = gl ? (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) : ARENA_MAP_TEXTURE_MAX;
    const maxTexture = Math.min(gpuMax, ARENA_MAP_TEXTURE_MAX);
    return new ArenaRenderer(app, host, options, maxTexture);
  }

  setScene = async (scene: IArenaRenderScene | null): Promise<void> => {
    const sceneChanged = (scene?.id ?? null) !== this.sceneId;
    const mapUrl = scene?.mapUrl ?? null;
    if (!sceneChanged && mapUrl === this.mapUrl) {
      if (!scene) return;
      if (this.loadingMap) this.scene = scene;
      else this.resizeBoard(scene);
      return;
    }
    const version = ++this.sceneVersion;
    this.scene = scene;
    this.loadingMap = true;
    this.sceneId = scene?.id ?? null;
    this.mapUrl = mapUrl;
    let loaded: ILoadedTexture<Texture> | null = null;
    if (mapUrl) {
      loaded = await loadTexture(mapUrl, this.maxTextureSize).catch(() => null);
      if (this.destroyed || version !== this.sceneVersion) {
        destroyTexture(loaded?.texture);
        return;
      }
      if (!loaded) this.mapUrl = undefined;
    }
    this.loadingMap = false;
    const current = this.scene;
    this.options.callbacks.onMapError(Boolean(mapUrl) && !loaded);
    this.mapLayer.removeChildren().forEach((child) => child.destroy());
    destroyTexture(this.mapTexture);
    this.mapTexture = loaded?.texture ?? null;
    this.bounds = current ? { width: current.width, height: current.height } : ARENA_EMPTY_BOUNDS;
    this.mapLayer.addChild(loaded ? new Sprite(loaded.texture) : new Graphics());
    this.drawBoard();
    if (sceneChanged) this.camera = this.storedCamera() ?? this.fittedCamera();
    this.applyCamera();
    this.options.callbacks.onSceneReady(this.bounds);
  };

  /**
   * Applies a new board size to the scene on screen: the map stretches to it and the camera zoom compensates,
   * so the map stays where it was on screen and only the tokens change size against it. When the zoom limits cut
   * that compensation, the same spot of the map stays at the center of the view.
   */
  private resizeBoard(scene: IArenaRenderScene): void {
    const previous = this.bounds;
    if (previous.width === scene.width && previous.height === scene.height) return;
    this.scene = scene;
    this.bounds = { width: scene.width, height: scene.height };
    this.drawBoard();
    if (previous.width > 0 && previous.height > 0) {
      const center = visibleCenterPoint(this.viewport(), this.insets());
      const before = screenToWorld(this.camera, center);
      const scale = clampZoom((this.camera.scale * previous.width) / scene.width);
      const world = {
        x: (before.x / previous.width) * scene.width,
        y: (before.y / previous.height) * scene.height,
      };
      this.camera = { scale, x: center.x - world.x * scale, y: center.y - world.y * scale };
    }
    this.applyCamera();
    this.options.callbacks.onSceneReady(this.bounds);
  }

  /** Stretches the map image (or draws the empty ground) over the whole board. */
  private drawBoard(): void {
    const ground = this.mapLayer.children[0];
    const { width, height } = this.bounds;
    if (ground instanceof Sprite) {
      ground.width = width;
      ground.height = height;
    } else if (ground instanceof Graphics) {
      ground
        .clear()
        .rect(0, 0, width, height)
        .fill({ color: ARENA_COLORS.void800 })
        .stroke({ width: 4, color: ARENA_COLORS.ruby500, alpha: 0.25 });
    }
    this.invalidate();
  }

  setTokens = (list: IArenaRenderToken[]): void => {
    const seen = new Set<string>();
    for (const data of list) {
      seen.add(data.id);
      const existing = this.tokens.get(data.id);
      const view = existing ?? this.createToken(data);
      const portraitChanged =
        existing !== undefined &&
        (existing.data.imageUrl !== data.imageUrl || existing.data.style !== data.style);
      const resizing = this.resize?.sizes.has(data.id) ?? false;
      const statusChanged = !existing || existing.data.status !== data.status;
      view.data = resizing ? { ...data, size: view.data.size } : data;
      if (statusChanged && performance.now() < view.holdStatusUntil) {
        view.pendingStatus = data.status;
      } else if (statusChanged) {
        const now = performance.now();
        view.pendingStatus = undefined;
        view.bars.setStatus(
          data.status,
          {
            animate: existing !== undefined,
            float: now - view.lastEffectAt > EFFECT_FLOAT_QUIET_MS,
          },
          now,
        );
      }
      if (portraitChanged) this.resetPortrait(view);
      if (!this.drag?.offsets.has(data.id)) view.target = { x: data.x, y: data.y };
      if (!existing) view.display = { ...view.target };
      if (!existing && data.id === this.turnTokenId) this.attachAura(view);
      this.drawToken(view);
      if (!existing) this.tokenLayer.addChild(view.container);
    }
    list.forEach((data, index) => {
      const view = this.tokens.get(data.id);
      if (view && this.tokenLayer.getChildAt(index) !== view.container)
        this.tokenLayer.setChildIndex(view.container, index);
    });
    for (const [id, view] of this.tokens) {
      if (seen.has(id)) continue;
      for (const effect of view.effects) effect.destroy();
      this.fading = this.fading.filter(({ effect }) => {
        if (effect.container.parent !== view.container) return true;
        effect.destroy();
        return false;
      });
      view.aura?.destroy();
      view.bars.destroy();
      view.container.destroy({ children: true });
      this.tokens.delete(id);
      this.drag?.offsets.delete(id);
    }
    this.prunePortraits();
    for (const id of this.drag?.offsets.keys() ?? []) {
      const dragged = this.tokens.get(id);
      if (dragged) this.tokenLayer.addChild(dragged.container);
    }
    this.invalidate();
  };

  setTurnToken = (tokenId: string | null): void => {
    if (tokenId === this.turnTokenId) return;
    const now = performance.now();
    const previous = this.turnTokenId ? this.tokens.get(this.turnTokenId) : undefined;
    previous?.aura?.leave(now);
    this.turnTokenId = tokenId;
    const view = tokenId ? this.tokens.get(tokenId) : undefined;
    if (view) {
      if (view.aura?.leaving) this.detachAura(view);
      if (!view.aura) this.attachAura(view);
    }
    this.invalidate();
  };

  private attachAura(view: ITokenView): void {
    const aura = new ArenaTurnAura({
      host: this.fxHost(),
      lite: this.options.lite,
      seed: this.effectSeed++,
    });
    view.aura = aura;
    view.container.addChildAt(aura.ground, 0);
    view.container.addChildAt(aura.back, 1);
    aura.layout({ size: view.data.size, style: view.data.style, ...this.extentsOf(view) });
  }

  private detachAura(view: ITokenView): void {
    view.aura?.destroy();
    view.aura = null;
    view.shadow.position.set(0, 0);
    view.shadow.scale.set(1);
    view.shadow.alpha = 1;
  }

  setSelection = (tokenIds: string[]): void => {
    const next = new Set(tokenIds);
    if (next.size === this.selection.size && tokenIds.every((id) => this.selection.has(id))) return;
    this.applySelection(next);
  };

  private applySelection(next: Set<string>): void {
    this.selection = next;
    for (const view of this.tokens.values()) this.drawToken(view);
    this.invalidate();
  }

  setSideInsets = (left: number, right: number): void => {
    this.insetLeft = left;
    this.insetRight = right;
  };

  setResizable = (resizable: boolean): void => {
    if (this.resizable === resizable) return;
    this.resizable = resizable;
    this.invalidate();
  };

  zoomBy = (factor: number): void => {
    const viewport = this.viewport();
    this.camera = zoomAt(this.camera, factor, { x: viewport.width / 2, y: viewport.height / 2 });
    this.applyCamera();
  };

  fitToMap = (): void => {
    this.camera = this.fittedCamera();
    this.applyCamera();
  };

  centerOn = (tokenId: string): void => {
    const view = this.tokens.get(tokenId);
    if (!view) return;
    this.camera = centerCamera(
      this.camera,
      view.target,
      this.viewport(),
      this.options.insetTop,
      this.insetRight,
      this.insetLeft,
    );
    this.applyCamera();
  };

  clientToWorld = (clientX: number, clientY: number): IArenaPoint | null => {
    const rect = this.app.canvas.getBoundingClientRect();
    const point = { x: clientX - rect.left, y: clientY - rect.top };
    if (!this.scene || !isInVisibleArea(point, this.viewport(), this.insets())) return null;
    if (document.elementFromPoint(clientX, clientY) !== this.app.canvas) return null;
    return screenToWorld(this.camera, point);
  };

  zoom = (): number => this.camera.scale;

  pointerWorld = (): IArenaPoint | null =>
    this.lastClient ? this.clientToWorld(this.lastClient.x, this.lastClient.y) : null;

  visibleCenter = (): IArenaPoint =>
    screenToWorld(this.camera, visibleCenterPoint(this.viewport(), this.insets()));

  /**
   * Plays damage and healing on the tokens they hit. A blow to many tokens keeps the rich animation for the first
   * `EFFECT_RICH_BUDGET` tokens on screen; the others (and the ones off screen) get the light flash, so an area
   * attack does not stack dozens of particle systems and filters on the GPU.
   */
  playEffects = (effects: IArenaEffect[]): void => {
    const now = performance.now();
    const delays = this.launchAttackers(effects);
    let budget = EFFECT_RICH_BUDGET;
    const targets = effects.flatMap(({ tokenId }) => this.tokens.get(tokenId) ?? []);
    for (const { tokenId, kind, resource, amount, attackerTokenId, effect: style } of effects) {
      const view = this.tokens.get(tokenId);
      if (!view) continue;
      const group =
        targets.length > 1
          ? groupOffsets(
              view.display,
              view.data.size / 2,
              targets.map((target) => target.display),
            )
          : null;
      const timing = attackerTokenId ? delays.get(attackerTokenId) : undefined;
      const hitMs = timing?.hitMs ?? 0;
      const delayMs = Math.max(hitMs - (timing?.leadMs ?? 0), 0);
      const attacker = attackerTokenId ? this.tokens.get(attackerTokenId) : undefined;
      const incoming = attacker ? unitDirection(attacker.display, view.display) : null;
      const rich = !this.options.lite && budget > 0 && this.isOnScreen(view);
      if (rich) budget -= 1;
      const effect = createTargetEffect(
        {
          kind,
          resource,
          amount,
          size: view.data.size,
          fontFamily: this.options.fontFamily,
          lite: !rich,
          seed: this.effectSeed++,
          delayMs,
          ...(style ? { style } : {}),
          ...(incoming ? { incoming } : {}),
          ...(group ? { group } : {}),
        },
        this.fxHost(),
      );
      this.attachEffect(view, effect);
      const impact = Math.max(hitMs, delayMs + (effect.impactMs ?? 0));
      view.lastEffectAt = now + impact;
      view.holdStatusUntil = now + impact;
    }
    this.invalidate();
  };

  private isOnScreen(view: ITokenView): boolean {
    const { scale, x, y } = this.camera;
    const radius = (view.data.size / 2) * scale;
    const sx = view.display.x * scale + x;
    const sy = view.display.y * scale + y;
    const { width, height } = this.viewport();
    return sx + radius > 0 && sy + radius > 0 && sx - radius < width && sy - radius < height;
  }

  private attachEffect(view: ITokenView, effect: IArenaEffectPlayer): void {
    view.effects.push(effect);
    view.container.addChild(effect.container);
    while (view.effects.length > EFFECT_MAX_PER_TOKEN) view.effects.shift()?.destroy();
  }

  /**
   * Plays each attacker's part toward its targets (their center when there are several): a blow to health makes
   * it fly and strike (on top of the other tokens), anything else makes it cast an orb in an arc. Returns, per
   * attacker, when the hit lands and how much earlier the target animation starts (its own wind-up). Nothing
   * plays in the light mode.
   */
  private launchAttackers(effects: IArenaEffect[]): Map<string, { hitMs: number; leadMs: number }> {
    const delays = new Map<string, { hitMs: number; leadMs: number }>();
    if (this.options.lite) return delays;
    const targetsOf = new Map<string, ITokenView[]>();
    const styleOf = new Map<string, ReturnType<typeof effectStyle>>();
    for (const { tokenId, attackerTokenId, kind, resource, effect } of effects) {
      const target = this.tokens.get(tokenId);
      if (!attackerTokenId || !target) continue;
      targetsOf.set(attackerTokenId, [...(targetsOf.get(attackerTokenId) ?? []), target]);
      styleOf.set(attackerTokenId, effectStyle(kind, resource, effect));
    }
    for (const [attackerId, targets] of targetsOf) {
      const attacker = this.tokens.get(attackerId);
      if (!attacker) continue;
      const center = {
        x: targets.reduce((sum, view) => sum + view.display.x, 0) / targets.length,
        y: targets.reduce((sum, view) => sum + view.display.y, 0) / targets.length,
      };
      const toward = { x: center.x - attacker.display.x, y: center.y - attacker.display.y };
      if (Math.hypot(toward.x, toward.y) < 1) continue;
      const play = createAttackerEffect(
        {
          style: styleOf.get(attackerId) ?? "strike",
          size: attacker.data.size,
          toward,
          targetRadius:
            targets.length === 1 ? (targets[0]?.data.size ?? 0) / 2 : attacker.data.size / 2,
          seed: this.effectSeed++,
        },
        this.fxHost(),
      );
      this.attachEffect(attacker, play.effect);
      if (play.flies) attacker.container.addChildAt(play.effect.container, 0);
      this.tokenLayer.addChild(attacker.container);
      delays.set(attackerId, { hitMs: play.hitMs, leadMs: play.leadMs ?? 0 });
    }
    return delays;
  }

  private fxHost(): IArenaFxHost {
    this.fxTextures ??= new ArenaFxTextures();
    this.shockwaves ??= new ArenaShockwaves(this.app);
    this.fxScreen ??= new ArenaFxScreen(this.app, this.world, this.world);
    return {
      textures: this.fxTextures.frames,
      shockwave: this.shockwaves.add,
      screen: this.fxScreen,
    };
  }

  retryMap = (): void => {
    this.mapUrl = undefined;
    void this.setScene(this.scene);
  };

  destroy = (): void => {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    window.clearTimeout(this.saveTimer);
    this.saveCamera();
    this.observer.disconnect();
    this.app.canvas.removeEventListener("wheel", this.onWheel);
    this.app.canvas.removeEventListener("contextmenu", this.preventMenu);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onWindowBlur);
    for (const view of this.tokens.values()) {
      for (const effect of view.effects) effect.destroy();
      view.effects = [];
      view.aura?.destroy();
      view.aura = null;
    }
    for (const { effect } of this.fading) if (!effect.container.destroyed) effect.destroy();
    this.fading = [];
    this.app.stage.removeChildren();
    this.uiLayer.destroy({ children: true });
    this.world.destroy({ children: true });
    destroyTexture(this.mapTexture);
    this.shockwaves?.destroy();
    this.fxScreen?.destroy();
    this.fxTextures?.destroy();
    for (const pending of this.portraits.values())
      void pending.then((texture) => destroyTexture(texture));
    this.portraits.clear();
    this.app.destroy({ removeView: true });
  };

  private fittedCamera(): IArenaCamera {
    return fitCamera(
      this.bounds,
      this.viewport(),
      this.options.insetTop,
      this.options.insetBottom,
      this.insetRight,
      this.insetLeft,
    );
  }

  private insets() {
    return { top: this.options.insetTop, left: this.insetLeft, right: this.insetRight };
  }

  private viewport() {
    return { width: this.app.screen.width, height: this.app.screen.height };
  }

  private invalidate = (): void => {
    this.urgent = true;
    this.schedule();
  };

  private schedule(): void {
    if (this.destroyed || this.frame) return;
    this.frame = requestAnimationFrame(this.tick);
  }

  /**
   * One frame. The light mode caps every frame at ~30 fps; otherwise, while only the turn aura moves (a slow bob
   * and a calm ring), the loop also runs at ~30 fps, and anything else (input, data, effects) draws at once.
   */
  private tick = (now: number): void => {
    this.frame = 0;
    const pace = this.options.lite
      ? ARENA_LITE_FRAME_MS
      : this.calmAura && !this.urgent
        ? ARENA_TURN_FRAME_MS
        : 0;
    if (pace > 0 && now - this.lastFrame < pace) {
      this.schedule();
      return;
    }
    this.urgent = false;
    this.lastFrame = now;
    const { animating, aura } = this.stepTokens(now);
    const rippling = this.shockwaves?.step(now) ?? false;
    this.drawSelectionFrame();
    this.app.render();
    this.calmAura = aura && !animating && !rippling;
    if (animating || rippling || aura) this.schedule();
  };

  /** Puts on the token the filters its playing animations ask for (only when they change). */
  private applyTokenFilters(view: ITokenView): void {
    const wanted = view.effects.flatMap((effect) => effect.tokenFilters ?? []);
    const current = view.container.filters ?? [];
    const same =
      wanted.length === current.length &&
      wanted.every((filter, index) => filter === current[index]);
    if (!same) view.container.filters = wanted.length > 0 ? wanted : null;
  }

  /**
   * What is left of the animations that ended fades out over `EFFECT_LINGER_MS` (a trace that dissipates instead of
   * vanishing), then is destroyed. True while something is still fading.
   */
  private fadeEnded(now: number): boolean {
    if (this.fading.length === 0) return false;
    this.fading = this.fading.filter(({ effect, start }) => {
      const left = 1 - (now - start) / EFFECT_LINGER_MS;
      if (effect.container.destroyed) return false;
      if (left > 0) {
        effect.container.alpha = Math.min(effect.container.alpha, left);
        return true;
      }
      effect.destroy();
      return false;
    });
    return this.fading.length > 0;
  }

  private stepTokens(now: number): { animating: boolean; aura: boolean } {
    let animating = false;
    let auraMoving = false;
    const factor = this.options.lite ? 1 : ARENA_TOKEN_LERP;
    for (const view of this.tokens.values()) {
      const { display, target } = view;
      if (display.x !== target.x || display.y !== target.y) {
        display.x = approach(display.x, target.x, factor, ARENA_SETTLE_DISTANCE);
        display.y = approach(display.y, target.y, factor, ARENA_SETTLE_DISTANCE);
        animating ||= display.x !== target.x || display.y !== target.y;
      }
      if (view.pendingStatus !== undefined && now >= view.holdStatusUntil) {
        view.bars.setStatus(view.pendingStatus, { animate: true, float: false }, now);
        view.pendingStatus = undefined;
      }
      animating = view.bars.step(now) || animating;
      let dx = 0;
      let dy = 0;
      let scaleX = 1;
      let scaleY = 1;
      if (view.effects.length > 0) {
        view.effects = view.effects.filter((effect) => {
          const { done, frame } = effect.step(now, this.camera.scale, view.bars.height);
          if (done) {
            this.fading.push({ effect, start: now });
            return false;
          }
          dx += frame.dx;
          dy += frame.dy;
          scaleX *= frame.scaleX;
          scaleY *= frame.scaleY;
          return true;
        });
        animating ||= view.effects.length > 0;
      }
      if (view.aura && !this.isOnScreen(view)) {
        if (view.aura.leaving) this.detachAura(view);
      } else if (view.aura) {
        const frame = view.aura.step(now);
        if (frame.done) this.detachAura(view);
        else {
          this.floatToken(view, frame.lift);
          dy -= frame.lift;
          auraMoving ||= frame.animating;
        }
      }
      view.container.position.set(display.x + dx, display.y + dy);
      view.container.scale.set(scaleX, scaleY);
      if (view.effects.length > 0 || view.container.filters?.length) this.applyTokenFilters(view);
    }
    return { animating: this.fadeEnded(now) || animating, aura: auraMoving };
  }

  /**
   * Keeps the ground pieces of a floating token on the floor while the token rises: its turn ring and its shadow
   * (smaller and fainter the higher it floats).
   */
  private floatToken(view: ITokenView, lift: number): void {
    if (view.aura) view.aura.ground.y = lift;
    const rise = view.data.size > 0 ? lift / view.data.size : 0;
    view.shadow.position.set(0, lift);
    view.shadow.scale.set(Math.max(1 - rise * ARENA_FLOAT_SHADOW.shrink, 0.5));
    view.shadow.alpha = Math.max(1 - rise * ARENA_FLOAT_SHADOW.fade, 0.3);
  }

  private applyCamera(): void {
    const now = performance.now();
    for (const view of this.tokens.values()) {
      this.scaleLabel(view);
      view.bars.layout(view.data.size, this.camera.scale, now, this.extentsOf(view).halfHeight);
    }
    this.world.scale.set(this.camera.scale);
    this.world.position.set(this.camera.x, this.camera.y);
    this.scheduleCameraSave();
    this.invalidate();
  }

  private storageKey(): string | null {
    return this.sceneId ? `${ARENA_CAMERA_STORAGE_PREFIX}${this.sceneId}` : null;
  }

  private storedCamera(): IArenaCamera | null {
    const key = this.storageKey();
    if (!key) return null;
    try {
      return parseStoredCamera(window.localStorage.getItem(key));
    } catch {
      return null;
    }
  }

  private scheduleCameraSave(): void {
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.saveCamera(), ARENA_CAMERA_SAVE_DELAY_MS);
  }

  private saveCamera(): void {
    const key = this.storageKey();
    if (!key) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(this.camera));
    } catch {
      return;
    }
  }

  private createToken(data: IArenaRenderToken): ITokenView {
    const container = new Container();
    const shadow = new Graphics();
    const base = new Graphics();
    const mask = new Graphics();
    const ring = new Graphics();
    const label = new Text({
      text: data.name,
      style: {
        fontFamily: this.options.fontFamily,
        fontSize: 18,
        fill: ARENA_COLORS.label,
        stroke: { color: ARENA_COLORS.black, width: 4, join: "round" },
        align: "center",
      },
    });
    label.anchor.set(0.5, 0);
    const bars = new ArenaStatusBars({
      fontFamily: this.options.fontFamily,
      lite: this.options.lite,
    });
    container.addChild(shadow, base, mask, ring, label, bars.container);
    container.eventMode = "static";
    container.on("pointerdown", (event: FederatedPointerEvent) => this.onTokenDown(data.id, event));
    container.on("pointerover", () => this.setHovered(data.id, true));
    container.on("pointerout", () => this.setHovered(data.id, false));
    const view: ITokenView = {
      data,
      container,
      shadow,
      base,
      ring,
      label,
      portrait: null,
      aspect: null,
      initial: null,
      mask,
      display: { x: data.x, y: data.y },
      target: { x: data.x, y: data.y },
      drawnKey: "",
      bars,
      effects: [],
      hovered: false,
      lastEffectAt: 0,
      pendingStatus: undefined,
      holdStatusUntil: 0,
      aura: null,
    };
    this.tokens.set(data.id, view);
    void this.attachPortrait(view);
    return view;
  }

  /**
   * Frees the portrait textures no token on the board uses anymore (another scene, a replaced image), so the
   * GPU memory follows the tokens on screen instead of growing for the whole session.
   */
  private prunePortraits(): void {
    const used = new Set<string>();
    for (const view of this.tokens.values()) {
      const key = this.portraitKey(view);
      if (key) used.add(key);
    }
    for (const [key, pending] of this.portraits) {
      if (used.has(key)) continue;
      this.portraits.delete(key);
      void pending.then((texture) => destroyTexture(texture));
    }
  }

  private resetPortrait(view: ITokenView): void {
    view.portrait?.destroy();
    view.portrait = null;
    view.aspect = null;
    view.drawnKey = "";
    void this.attachPortrait(view);
  }

  /** Largest texture side of a token image: figures keep more detail, except in the lite mode. */
  private portraitSide(view: ITokenView): number {
    return view.data.style === "figure" && !this.options.lite
      ? ARENA_FIGURE_TEXTURE_SIZE
      : ARENA_TOKEN_TEXTURE_SIZE;
  }

  /** Cache key of a token image: the same URL at another texture size is another texture. */
  private portraitKey(view: ITokenView): string | null {
    return view.data.imageUrl ? `${this.portraitSide(view)}|${view.data.imageUrl}` : null;
  }

  private async attachPortrait(view: ITokenView): Promise<void> {
    const url = view.data.imageUrl;
    const key = this.portraitKey(view);
    if (!url || !key) return;
    let pending = this.portraits.get(key);
    if (!pending) {
      const loading: Promise<Texture | null> = loadTokenTexture(url, this.portraitSide(view)).catch(
        () => {
          if (this.portraits.get(key) === loading) this.portraits.delete(key);
          return null;
        },
      );
      pending = loading;
      this.portraits.set(key, pending);
    }
    const texture = await pending;
    if (!texture || this.destroyed || view.container.destroyed || this.portraitKey(view) !== key)
      return;
    if (this.portraits.get(key) !== pending) {
      void this.attachPortrait(view);
      return;
    }
    view.portrait?.destroy();
    view.portrait = new Sprite(texture);
    view.portrait.anchor.set(0.5);
    view.aspect = texture.height > 0 ? texture.width / texture.height : null;
    view.container.addChildAt(view.portrait, view.container.getChildIndex(view.ring));
    view.drawnKey = "";
    this.drawToken(view);
    this.invalidate();
  }

  private setHovered(tokenId: string, hovered: boolean): void {
    const view = this.tokens.get(tokenId);
    if (!view || view.hovered === hovered) return;
    view.hovered = hovered;
    view.bars.setExpanded(hovered || this.selection.has(tokenId), performance.now());
    this.invalidate();
  }

  private extentsOf(view: ITokenView): { halfWidth: number; halfHeight: number } {
    return tokenExtents(view.data.size, view.data.style, view.aspect);
  }

  private drawToken(view: ITokenView): void {
    const { data } = view;
    const selected = this.selection.has(data.id);
    const now = performance.now();
    const { halfWidth, halfHeight } = this.extentsOf(view);
    view.bars.layout(data.size, this.camera.scale, now, halfHeight);
    view.bars.setExpanded(selected || view.hovered, now);
    const key = [
      data.size,
      data.name,
      data.tone,
      data.hidden,
      data.style,
      data.label,
      selected,
      !!view.portrait,
      view.aspect,
    ].join("|");
    if (key === view.drawnKey) return;
    view.drawnKey = key;
    view.aura?.layout({ size: data.size, style: data.style, halfWidth, halfHeight });
    const ringColor = selected
      ? ARENA_COLORS.gold400
      : data.tone === "own"
        ? ARENA_COLORS.ruby500
        : ARENA_COLORS.teal400;
    if (data.style === "figure") this.drawFigure(view, selected);
    else this.drawPortrait(view, ringColor, selected);
    if (!view.portrait) {
      if (!view.initial) {
        view.initial = new Text({
          text: "",
          style: { fontFamily: this.options.fontFamily, fill: ARENA_COLORS.ruby400 },
        });
        view.initial.anchor.set(0.5);
        view.container.addChildAt(view.initial, view.container.getChildIndex(view.ring));
      }
      view.initial.text = data.name.charAt(0).toUpperCase();
      view.initial.style.fontSize = Math.round(data.size * 0.42);
    }
    view.label.text = data.name;
    view.label.style.fontSize = Math.round(Math.min(Math.max(data.size * 0.16, 14), 30));
    view.label.position.set(0, halfHeight + ARENA_LABEL_GAP);
    view.label.visible = data.label !== "hidden";
    view.label.alpha = data.label === "faint" ? ARENA_LABEL_FAINT_ALPHA : 1;
    this.scaleLabel(view);
    view.container.alpha = data.hidden ? 0.5 : 1;
    view.container.hitArea =
      data.style === "figure"
        ? new Rectangle(-halfWidth, -halfHeight, halfWidth * 2, halfHeight * 2)
        : new Circle(0, 0, data.size / 2);
    view.container.cursor = data.controllable ? "grab" : "pointer";
  }

  private drawPortrait(view: ITokenView, ringColor: number, selected: boolean): void {
    const { data } = view;
    const radius = data.size / 2;
    const ringWidth = Math.max(3, data.size * 0.045);
    view.shadow
      .clear()
      .circle(0, data.size * 0.05, radius + 2)
      .fill({ color: ARENA_COLORS.black, alpha: 0.45 });
    view.base.clear().circle(0, 0, radius).fill({ color: ARENA_COLORS.void700 });
    view.mask
      .clear()
      .circle(0, 0, radius - ringWidth / 2)
      .fill({ color: ARENA_COLORS.black });
    view.ring.clear().circle(0, 0, radius).stroke({ width: ringWidth, color: ringColor });
    if (selected)
      view.ring
        .circle(0, 0, radius + ringWidth * 1.6)
        .stroke({ width: 2, color: ARENA_COLORS.gold400, alpha: 0.45 });
    if (view.portrait) {
      view.portrait.mask = view.mask;
      view.portrait.width = data.size;
      view.portrait.height = data.size;
      view.initial?.destroy();
      view.initial = null;
    }
  }

  /**
   * An isometric figure: the image whole, in its own proportion, with no frame or base; a selected one gets
   * thin gold corner brackets around the image.
   */
  private drawFigure(view: ITokenView, selected: boolean): void {
    const { data } = view;
    const { halfWidth, halfHeight } = this.extentsOf(view);
    view.shadow.clear();
    view.base.clear();
    view.mask.clear();
    view.ring.clear();
    if (selected) {
      const pad = Math.max(4, data.size * 0.04);
      const arm = Math.min(halfWidth, halfHeight) * FIGURE_BRACKET_RATIO;
      const left = -halfWidth - pad;
      const right = halfWidth + pad;
      const top = -halfHeight - pad;
      const bottom = halfHeight + pad;
      for (const [x, y, dx, dy] of [
        [left, top, 1, 1],
        [right, top, -1, 1],
        [left, bottom, 1, -1],
        [right, bottom, -1, -1],
      ] as const) {
        view.ring
          .moveTo(x + dx * arm, y)
          .lineTo(x, y)
          .lineTo(x, y + dy * arm);
      }
      view.ring.stroke({
        width: Math.max(2, data.size * 0.02),
        color: ARENA_COLORS.gold400,
        cap: "square",
      });
    }
    if (view.portrait) {
      view.portrait.mask = null;
      view.portrait.width = halfWidth * 2;
      view.portrait.height = halfHeight * 2;
      view.initial?.destroy();
      view.initial = null;
    }
  }

  private scaleLabel(view: ITokenView): void {
    const fontSize = Number(view.label.style.fontSize) || ARENA_LABEL_MIN_SCREEN_PX;
    view.label.scale.set(labelScale(fontSize, this.camera.scale));
  }

  private worldPoint(event: FederatedPointerEvent): IArenaPoint {
    return screenToWorld(this.camera, { x: event.global.x, y: event.global.y });
  }

  private trackPointer(event: FederatedPointerEvent): void {
    this.pointers.set(event.pointerId, { x: event.global.x, y: event.global.y });
    if (this.pointers.size === 2) {
      this.cancelGesture();
      this.pinch = { distance: this.pointerDistance(), camera: { ...this.camera } };
    }
  }

  private pointerDistance(): number {
    const [first, second] = [...this.pointers.values()];
    if (!first || !second) return 0;
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  private wantsPan(event: FederatedPointerEvent): boolean {
    return event.button === 1 || event.button === 2 || (event.button === 0 && this.spaceHeld);
  }

  private startPan(event: FederatedPointerEvent, menuTokenId: string | null = null): void {
    this.pan = {
      pointerId: event.pointerId,
      start: { x: event.global.x, y: event.global.y },
      camera: { ...this.camera },
      moved: false,
      menu: event.button === 2,
      menuTokenId: event.button === 2 ? menuTokenId : null,
    };
    this.app.canvas.style.cursor = "grabbing";
  }

  private onTokenDown(tokenId: string, event: FederatedPointerEvent): void {
    event.stopPropagation();
    this.trackPointer(event);
    if (this.pinch) return;
    if (this.wantsPan(event)) {
      this.startPan(event, tokenId);
      return;
    }
    if (event.button !== 0) return;
    if (togglesSelection(event)) {
      this.options.callbacks.onSelect([tokenId], "toggle");
      return;
    }
    const group = this.selection.has(tokenId) ? [...this.selection] : [tokenId];
    if (!this.selection.has(tokenId)) {
      this.applySelection(new Set(group));
      this.options.callbacks.onSelect(group, "replace");
    }
    const point = this.worldPoint(event);
    const offsets = new Map<string, IArenaPoint>();
    for (const id of group) {
      const view = this.tokens.get(id);
      if (!view?.data.controllable) continue;
      offsets.set(id, { x: point.x - view.target.x, y: point.y - view.target.y });
      this.tokenLayer.addChild(view.container);
    }
    if (offsets.size === 0) return;
    this.drag = {
      pointerId: event.pointerId,
      tokenId,
      offsets,
      start: { x: event.global.x, y: event.global.y },
      moves: [],
      moved: false,
    };
    this.app.canvas.style.cursor = "grabbing";
  }

  private onStageDown = (event: FederatedPointerEvent): void => {
    this.trackPointer(event);
    if (this.pinch) return;
    if (this.wantsPan(event)) {
      this.startPan(event);
      return;
    }
    if (event.button !== 0) return;
    if (event.pointerType === "touch") {
      this.startPan(event);
      return;
    }
    const start = { x: event.global.x, y: event.global.y };
    this.marquee = {
      pointerId: event.pointerId,
      start,
      current: start,
      additive: togglesSelection(event),
      moved: false,
    };
  };

  private onPointerMove = (event: FederatedPointerEvent): void => {
    this.lastClient = { x: event.client.x, y: event.client.y };
    if (this.pointers.has(event.pointerId))
      this.pointers.set(event.pointerId, { x: event.global.x, y: event.global.y });
    if (this.pinch && this.pointers.size === 2) {
      const [first, second] = [...this.pointers.values()];
      if (!first || !second || this.pinch.distance === 0) return;
      const middle = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      this.camera = zoomAt(this.pinch.camera, this.pointerDistance() / this.pinch.distance, middle);
      this.applyCamera();
      return;
    }
    const screen = { x: event.global.x, y: event.global.y };
    const resize = this.resize;
    if (resize && resize.pointerId === event.pointerId) {
      this.applyResize(resize, screen);
      return;
    }
    const drag = this.drag;
    if (drag && drag.pointerId === event.pointerId) {
      if (!drag.moved && distance(screen, drag.start) < ARENA_CLICK_SLOP) return;
      drag.moved = true;
      const world = this.worldPoint(event);
      drag.moves = [...drag.offsets].flatMap(([tokenId, offset]) => {
        const view = this.tokens.get(tokenId);
        if (!view) return [];
        const point = clampToMap({ x: world.x - offset.x, y: world.y - offset.y }, this.bounds);
        view.target = { ...point };
        view.display = { ...point };
        return [{ tokenId, ...point }];
      });
      this.invalidate();
      return;
    }
    const marquee = this.marquee;
    if (marquee && marquee.pointerId === event.pointerId) {
      if (!marquee.moved && distance(screen, marquee.start) < ARENA_CLICK_SLOP) return;
      marquee.moved = true;
      marquee.current = screen;
      this.drawMarquee(marquee);
      return;
    }
    const pan = this.pan;
    if (pan && pan.pointerId === event.pointerId) {
      if (!pan.moved && distance(screen, pan.start) < ARENA_CLICK_SLOP) return;
      pan.moved = true;
      this.camera = {
        ...pan.camera,
        x: pan.camera.x + screen.x - pan.start.x,
        y: pan.camera.y + screen.y - pan.start.y,
      };
      this.applyCamera();
    }
  };

  private onPointerUp = (event: FederatedPointerEvent): void => {
    this.pointers.delete(event.pointerId);
    if (this.pinch) {
      if (this.pointers.size < 2) this.pinch = null;
      return;
    }
    const resize = this.resize;
    if (resize && resize.pointerId === event.pointerId) {
      this.resize = null;
      this.finishResize(resize);
      return;
    }
    const drag = this.drag;
    if (drag && drag.pointerId === event.pointerId) {
      this.drag = null;
      this.restoreCursor();
      if (drag.moved && drag.moves.length > 0) this.options.callbacks.onDrop(drag.moves);
      else if (!drag.moved && this.selection.size > 1) {
        this.applySelection(new Set([drag.tokenId]));
        this.options.callbacks.onSelect([drag.tokenId], "replace");
      }
      return;
    }
    const marquee = this.marquee;
    if (marquee && marquee.pointerId === event.pointerId) {
      this.marquee = null;
      this.marqueeBox.clear();
      this.invalidate();
      if (!marquee.moved) {
        if (!marquee.additive) this.options.callbacks.onSelect([], "replace");
        return;
      }
      const corners = [marquee.start, marquee.current].map((point) =>
        screenToWorld(this.camera, point),
      );
      const picked = tokensInRect(
        [...this.tokens.values()].map((view) => ({ id: view.data.id, ...view.target })),
        corners[0] ?? marquee.start,
        corners[1] ?? marquee.current,
      );
      this.options.callbacks.onSelect(picked, marquee.additive ? "add" : "replace");
      return;
    }
    const pan = this.pan;
    if (pan && pan.pointerId === event.pointerId) {
      this.pan = null;
      this.restoreCursor();
      if (!pan.moved && pan.menu) {
        const tokenId =
          pan.menuTokenId && this.tokens.has(pan.menuTokenId) ? pan.menuTokenId : null;
        this.swallowNextMenu();
        this.options.callbacks.onTokenMenu(tokenId, { x: event.clientX, y: event.clientY });
      }
    }
  };

  private onPointerCancel = (event: FederatedPointerEvent): void => {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    this.cancelGesture();
  };

  private selectionBox(): { left: number; top: number; right: number; bottom: number } | null {
    let box: { left: number; top: number; right: number; bottom: number } | null = null;
    for (const id of this.selection) {
      const view = this.tokens.get(id);
      if (!view) continue;
      const { halfWidth, halfHeight } = this.extentsOf(view);
      const labelHeight = ARENA_LABEL_GAP + view.label.height;
      const barsHeight = view.bars.height;
      const { x, y } = view.display;
      box = box
        ? {
            left: Math.min(box.left, x - halfWidth),
            top: Math.min(box.top, y - halfHeight - barsHeight),
            right: Math.max(box.right, x + halfWidth),
            bottom: Math.max(box.bottom, y + halfHeight + labelHeight),
          }
        : {
            left: x - halfWidth,
            top: y - halfHeight - barsHeight,
            right: x + halfWidth,
            bottom: y + halfHeight + labelHeight,
          };
    }
    return box;
  }

  private drawSelectionFrame(): void {
    const box = this.resizable ? this.selectionBox() : null;
    this.selectionFrame.clear();
    for (const handle of this.handles) handle.visible = box !== null;
    if (!box) return;
    const { scale, x, y } = this.camera;
    const left = box.left * scale + x - ARENA_FRAME_PADDING;
    const top = box.top * scale + y - ARENA_FRAME_PADDING;
    const right = box.right * scale + x + ARENA_FRAME_PADDING;
    const bottom = box.bottom * scale + y + ARENA_FRAME_PADDING;
    this.selectionFrame
      .rect(left, top, right - left, bottom - top)
      .stroke({ width: 1, color: ARENA_COLORS.gold400, alpha: 0.7 });
    RESIZE_CORNERS.forEach((corner, index) => {
      this.handles[index]?.position.set(corner.x ? right : left, corner.y ? bottom : top);
    });
  }

  private onHandleDown = (event: FederatedPointerEvent): void => {
    event.stopPropagation();
    this.trackPointer(event);
    if (this.pinch || event.button !== 0) return;
    const box = this.selectionBox();
    if (!box) return;
    const center = {
      x: ((box.left + box.right) / 2) * this.camera.scale + this.camera.x,
      y: ((box.top + box.bottom) / 2) * this.camera.scale + this.camera.y,
    };
    const sizes = new Map<string, number>();
    for (const id of this.selection) {
      const view = this.tokens.get(id);
      if (view) sizes.set(id, view.data.size);
    }
    this.resize = {
      pointerId: event.pointerId,
      center,
      startDistance: Math.max(distance(center, { x: event.global.x, y: event.global.y }), 1),
      sizes,
    };
  };

  private applyResize(resize: IResizeState, screen: IArenaPoint): void {
    const factor = distance(resize.center, screen) / resize.startDistance;
    for (const [id, size] of resize.sizes) {
      const view = this.tokens.get(id);
      if (!view) continue;
      view.data = { ...view.data, size: scaleTokenSize(size, factor) };
      this.drawToken(view);
    }
    this.invalidate();
  }

  private finishResize(resize: IResizeState): void {
    const updates = [...resize.sizes].flatMap(([id, before]) => {
      const size = this.tokens.get(id)?.data.size;
      return size !== undefined && size !== before ? [{ id, size }] : [];
    });
    if (updates.length > 0) this.options.callbacks.onResize(updates);
  }

  private cancelGesture(): void {
    if (this.resize) {
      for (const [id, size] of this.resize.sizes) {
        const view = this.tokens.get(id);
        if (!view) continue;
        view.data = { ...view.data, size };
        this.drawToken(view);
      }
      this.resize = null;
    }
    if (this.drag) {
      for (const id of this.drag.offsets.keys()) {
        const view = this.tokens.get(id);
        if (view) view.target = { x: view.data.x, y: view.data.y };
      }
    }
    this.drag = null;
    this.pan = null;
    this.marquee = null;
    this.marqueeBox.clear();
    this.restoreCursor();
    this.invalidate();
  }

  private drawMarquee({ start, current }: IMarqueeState): void {
    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const width = Math.abs(current.x - start.x);
    const height = Math.abs(current.y - start.y);
    this.marqueeBox
      .clear()
      .rect(x, y, width, height)
      .fill({ color: ARENA_COLORS.ruby500, alpha: 0.12 })
      .stroke({ width: 1, color: ARENA_COLORS.ruby400, alpha: 0.9 });
    this.invalidate();
  }

  private restoreCursor(): void {
    this.app.canvas.style.cursor = this.spaceHeld ? "grab" : "";
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.code !== "Space" || event.repeat || isEditableTarget(event.target)) return;
    if (!this.host.contains(document.activeElement) && document.activeElement !== document.body)
      return;
    event.preventDefault();
    this.spaceHeld = true;
    if (!this.pan) this.app.canvas.style.cursor = "grab";
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    if (event.code !== "Space") return;
    this.spaceHeld = false;
    if (!this.pan) this.restoreCursor();
  };

  private onWindowBlur = (): void => {
    this.spaceHeld = false;
    this.pointers.clear();
    this.pinch = null;
    this.cancelGesture();
  };

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const rect = this.app.canvas.getBoundingClientRect();
    const factor = Math.exp(-event.deltaY * ARENA_WHEEL_SENSITIVITY);
    this.camera = zoomAt(this.camera, factor, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    this.applyCamera();
  };

  /**
   * Blocks the browser menu of this right click wherever it lands: on Windows it fires after the button comes
   * up, when "Aplicar mudança" is already open under the pointer.
   */
  private swallowNextMenu(): void {
    const swallow = (event: Event) => {
      event.preventDefault();
      window.removeEventListener("contextmenu", swallow, true);
    };
    window.addEventListener("contextmenu", swallow, true);
    window.setTimeout(() => window.removeEventListener("contextmenu", swallow, true), 600);
  }

  private preventMenu = (event: Event): void => {
    event.preventDefault();
  };

  private onResize = (): void => {
    const width = Math.max(this.host.clientWidth, 1);
    const height = Math.max(this.host.clientHeight, 1);
    if (width === this.app.screen.width && height === this.app.screen.height) return;
    this.app.renderer.resize(width, height);
    this.invalidate();
  };
}
