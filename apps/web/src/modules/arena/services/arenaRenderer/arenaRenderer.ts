import {
  ARENA_EFFECT_STYLES,
  WORLD_MAP_BOARD,
  WORLD_PARTY_ID,
  type ArenaEffectStyle,
  clampToMap,
  clampToWorld,
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
  ImageSource,
  Rectangle,
  RenderTexture,
  Sprite,
  Text,
  Texture,
} from "pixi.js";

import { loadAsset } from "@/core/services/assets";
import { fetchMediaBlob } from "@/core/services/http";
import {
  ARENA_EMPTY_BOUNDS,
  WORLD_MAP_URL,
  WORLD_PARTY_COLORS,
} from "@/modules/arena/arena.constants";
import { ArenaStatusBars } from "@/modules/arena/services/arenaStatusBars";
import { ArenaFxScreen } from "@/modules/arena/services/arenaFxScreen";
import { ArenaFxTextures } from "@/modules/arena/services/arenaFxTextures";
import { ArenaTurnAura } from "@/modules/arena/services/arenaTurnAura";
import { ArenaPartyToken } from "@/modules/arena/services/arenaPartyToken";
import { ArenaWorldClouds } from "@/modules/arena/services/arenaWorldClouds";
import {
  ArenaWorldTransition,
  easeInFlight,
  easeOutFlight,
  type WorldFlight,
} from "@/modules/arena/services/arenaWorldTransition";
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
  ARENA_AMBIENT_FRAME_MS,
  ARENA_BRUSH_CURSOR,
  ARENA_PASSAGE_CAMERA,
  ARENA_PARTY_SCREEN,
  ARENA_WARM_STEPS_MS,
  ARENA_WARM_TOKEN_SIZE,
  ARENA_WARM_UP_DELAY_MS,
  ARENA_WORLD_LITE_TEXTURE,
} from "./arenaRenderer.constants";
import type {
  ArenaSceneKind,
  IArenaCamera,
  IArenaWorldBrush,
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
  tweenCamera,
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
  /** The rune of the party token (world map only). */
  party: ArenaPartyToken | null;
  /** Extra scale that keeps the party token between a smallest and a largest size on screen. */
  screenScale: number;
}

interface ICameraTween {
  from: IArenaCamera;
  to: IArenaCamera;
  start: number;
  ms: number;
  ease: (t: number) => number;
  /** Screen point whose world point glides between the two cameras (the middle of the view by default). */
  anchor: IArenaPoint;
}

interface IPaintState {
  pointerId: number;
  last: IArenaPoint;
}

/**
 * How a scene switch plays: a flight through the clouds (scene and world map trade places), only the landing (the
 * world map shown first), gathering the clouds again (a switch while they clear) or nothing new (a switch while
 * they gather: the flight lands on the newest map).
 */
type ArenaPassage = "fly" | "land" | "regather" | "continue" | null;

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
 * Decodes a fixed image of the app (the world map) from the bytes the asset loader already downloaded for the
 * loading screen, no larger than `maxSize`. The texture keeps mipmaps, so the map stays crisp (not grainy) when the
 * camera pulls back to the whole world.
 */
async function loadStaticTexture(url: string, maxSize: number): Promise<ILoadedTexture<Texture>> {
  const blob = await loadAsset(url);
  const original = await createImageBitmap(blob);
  const { width, height } = original;
  const target = fitTextureSize(width, height, maxSize);
  let bitmap = original;
  if (target.scaled) {
    try {
      bitmap = await createImageBitmap(blob, {
        resizeWidth: target.width,
        resizeHeight: target.height,
        resizeQuality: "high",
      });
    } finally {
      original.close();
    }
  }
  try {
    const source = new ImageSource({
      resource: bitmap,
      autoGenerateMipmaps: true,
      scaleMode: "linear",
      mipmapFilter: "linear",
      maxAnisotropy: 8,
    });
    return { texture: new Texture({ source }), width, height };
  } catch (error) {
    bitmap.close();
    throw error;
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
  /** Only ambient things (clouds, the party colors) moved in the last frame. */
  private calmAmbient = false;
  private sceneKind: ArenaSceneKind | null = null;
  private clouds: ArenaWorldClouds | null = null;
  private worldFog: Uint8Array | null = null;
  private fogAlpha = 1;
  private transition: ArenaWorldTransition | null = null;
  /** Tokens set while the clouds close over the old map; they show once the new map is under the clouds. */
  private heldTokens: IArenaRenderToken[] | null = null;
  private cameraTween: ICameraTween | null = null;
  private brush: IArenaWorldBrush | null = null;
  private paint: IPaintState | null = null;
  private readonly brushCursor = new Graphics();
  private brushClient: IArenaPoint | null = null;
  private wakeTimer = 0;
  /** The world map texture, kept while the renderer lives (switching back to the world map uploads nothing). */
  private worldTexture: Promise<ILoadedTexture<Texture> | null> | null = null;
  private worldLoaded: ILoadedTexture<Texture> | null = null;
  private warmTimer = 0;
  /** Whether scene switches fly through the clouds (the players); the GM switches at once. */
  private passagesEnabled = true;
  private warmedWorld = false;
  private warmedEffects: Promise<void> | null = null;
  /** Real animations that arrived during the warm-up, played once it has cleaned up after itself. */
  private heldEffects: IArenaEffect[][] | null = null;

  private constructor(
    private readonly app: Application,
    private readonly host: HTMLElement,
    private readonly options: IArenaRendererOptions,
    private readonly maxTextureSize: number,
  ) {
    this.world.addChild(this.mapLayer, this.tokenLayer);
    this.uiLayer.addChild(this.selectionFrame, this.marqueeBox, this.brushCursor);
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
    app.canvas.addEventListener("pointerleave", this.onCanvasLeave);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onWindowBlur);
    this.observer = new ResizeObserver(this.onResize);
    this.observer.observe(host);
    this.warmTimer = window.setTimeout(this.warmUp, ARENA_WARM_UP_DELAY_MS);
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
    const passage = sceneChanged ? this.passageTo(scene?.kind ?? null) : null;
    if (passage === "fly") this.takeOff(this.sceneKind === "world" ? "in" : "out");
    if (passage === "regather") this.regather();
    if (passage === "land" && !this.transition) this.coverForLanding();
    this.scene = scene;
    this.loadingMap = true;
    this.sceneId = scene?.id ?? null;
    this.mapUrl = mapUrl;
    let loaded: ILoadedTexture<Texture> | null = null;
    if (mapUrl) {
      loaded =
        scene?.kind === "world"
          ? await this.loadWorldTexture(mapUrl)
          : await loadTexture(mapUrl, this.maxTextureSize).catch(() => null);
      if (this.destroyed || version !== this.sceneVersion) {
        if (loaded && !this.isWorldTexture(loaded.texture)) destroyTexture(loaded.texture);
        return;
      }
      if (!loaded) this.mapUrl = undefined;
    }
    if (this.transition) {
      await this.transition.whenCovered();
      if (this.destroyed || version !== this.sceneVersion) {
        if (loaded && !this.isWorldTexture(loaded.texture)) destroyTexture(loaded.texture);
        return;
      }
    }
    this.loadingMap = false;
    const current = this.scene;
    this.options.callbacks.onMapError(Boolean(mapUrl) && !loaded);
    this.mapLayer.removeChildren().forEach((child) => child.destroy());
    if (this.mapTexture && !this.isWorldTexture(this.mapTexture)) destroyTexture(this.mapTexture);
    this.mapTexture = loaded?.texture ?? null;
    this.bounds = current ? { width: current.width, height: current.height } : ARENA_EMPTY_BOUNDS;
    this.mapLayer.addChild(loaded ? new Sprite(loaded.texture) : new Graphics());
    this.sceneKind = current?.kind ?? null;
    this.syncClouds();
    this.drawBoard();
    const held = this.heldTokens;
    this.heldTokens = null;
    if (held) this.setTokens(held);
    if (sceneChanged) this.camera = this.storedCamera() ?? this.fittedCamera();
    if (this.transition) this.land();
    this.applyCamera(false);
    this.options.callbacks.onSceneReady(this.bounds);
  };

  /**
   * The world map texture: decoded once from the downloaded bytes and sent to the GPU right away (with its
   * mipmaps), so the frame where it first shows does not stall the flight through the clouds.
   */
  private loadWorldTexture(url: string): Promise<ILoadedTexture<Texture> | null> {
    const maxSize = this.options.lite ? ARENA_WORLD_LITE_TEXTURE : this.maxTextureSize;
    this.worldTexture ??= loadStaticTexture(url, maxSize)
      .then((loaded) => {
        if (this.destroyed) {
          destroyTexture(loaded.texture);
          return null;
        }
        const system: unknown = this.app.renderer.texture;
        if (system && typeof system === "object" && "initSource" in system) {
          (system as { initSource: (source: unknown) => void }).initSource(loaded.texture.source);
        }
        this.worldLoaded = loaded;
        return loaded;
      })
      .catch(() => {
        this.worldTexture = null;
        return null;
      });
    return this.worldTexture;
  }

  private isWorldTexture(texture: Texture): boolean {
    return this.worldLoaded?.texture === texture;
  }

  /**
   * Gets the world map ready while the Arena is idle: compiles the shaders of the clouds, of the flight and of the
   * party token (drawing them once off screen; the compiled programs are cached) and decodes and uploads the world
   * map, so the first flight to the world map does not stall in the middle.
   */
  private warmUp = (): void => {
    window.clearTimeout(this.warmTimer);
    if (this.destroyed || this.warmedWorld) return;
    this.warmedWorld = true;
    const stage = new Container();
    const clouds = new ArenaWorldClouds({
      lite: this.options.lite,
      board: WORLD_MAP_BOARD,
      seed: 1,
    });
    clouds.fitView({ x: 0, y: 0, width: 8, height: 8 });
    const flight = new ArenaWorldTransition({
      seed: 1,
      lite: this.options.lite,
      flight: "out",
      size: () => ({ width: 8, height: 8 }),
    });
    flight.step(performance.now());
    const party = new ArenaPartyToken({
      host: this.fxHost(),
      lite: this.options.lite,
      seed: 1,
      colors: WORLD_PARTY_COLORS,
    });
    party.layout(8, false);
    party.step(performance.now());
    stage.addChild(clouds.layer, flight.layer, party.back, party.body);
    const target = RenderTexture.create({ width: 8, height: 8, resolution: 1 });
    this.app.renderer.render({ container: stage, target });
    target.destroy(true);
    clouds.destroy();
    flight.destroy();
    party.destroy();
    stage.destroy();
    void this.loadWorldTexture(WORLD_MAP_URL);
  };

  /**
   * How a switch to a map of `kind` plays: every switch of map flies the camera through the clouds (up from a scene,
   * down onto a scene; entering the world map it lands pulling away from the party, leaving it it dives into the
   * party); the world map shown first lands from the clouds. A switch during a flight never cancels it: while the clouds gather it lands on the newest map,
   * and while they clear they gather again from where they are. Only for the players (the GM switches at once).
   */
  private passageTo(kind: ArenaSceneKind | null): ArenaPassage {
    if (!this.passagesEnabled || kind === null) return null;
    if (this.transition) return this.transition.departing ? "regather" : "continue";
    if (this.sceneKind !== null) return "fly";
    if (this.sceneKind === null && kind === "world") return "land";
    return null;
  }

  private newTransition(flight: WorldFlight): ArenaWorldTransition {
    const transition = new ArenaWorldTransition({
      seed: this.effectSeed++,
      lite: this.options.lite,
      flight,
      size: () => this.viewport(),
    });
    this.transition = transition;
    const stage = this.app.stage;
    stage.addChildAt(transition.layer, stage.getChildIndex(this.uiLayer));
    return transition;
  }

  /** Where the party token is on the screen now, when it is on the board. */
  private partyOnScreen(): IArenaPoint | null {
    const party = this.sceneKind === "world" ? this.tokens.get(WORLD_PARTY_ID) : undefined;
    if (!party) return null;
    return {
      x: party.display.x * this.camera.scale + this.camera.x,
      y: party.display.y * this.camera.scale + this.camera.y,
    };
  }

  /**
   * The camera takes off: flying up (`out`) it pulls away from the middle of the view, flying down (`in`) it dives
   * toward the party token, picking up speed while the clouds thicken to white; the tokens of the next map wait
   * until the screen is white.
   */
  private takeOff(flight: WorldFlight): ArenaWorldTransition {
    const focus = this.partyOnScreen() ?? visibleCenterPoint(this.viewport(), this.insets());
    const now = performance.now();
    const transition = this.newTransition(flight);
    transition.approach(focus, now);
    this.heldTokens = [...this.tokens.values()].map((view) => view.data);
    const factor = flight === "in" ? ARENA_PASSAGE_CAMERA.dive : ARENA_PASSAGE_CAMERA.rise;
    this.cameraTween = {
      from: { ...this.camera },
      to: zoomAt(this.camera, factor, focus),
      start: now,
      ms: transition.timing.approach,
      ease: easeInFlight,
      anchor: focus,
    };
    this.invalidate();
    return transition;
  }

  /**
   * A new switch while the clouds clear over the map that just landed: they thicken again from where they are and
   * the camera takes off once more from where it is (diving toward the party on the world map, pulling away from a
   * scene), so a quick back and forth reads as one continuous flight.
   */
  private regather(): void {
    const transition = this.transition;
    if (!transition) return;
    const now = performance.now();
    const flight: WorldFlight = this.sceneKind === "world" ? "in" : "out";
    const focus = this.partyOnScreen() ?? visibleCenterPoint(this.viewport(), this.insets());
    transition.regather(flight, focus, now);
    this.heldTokens = [...this.tokens.values()].map((view) => view.data);
    this.cameraTween = {
      from: { ...this.camera },
      to: zoomAt(
        this.camera,
        flight === "in" ? ARENA_PASSAGE_CAMERA.dive : ARENA_PASSAGE_CAMERA.rise,
        focus,
      ),
      start: now,
      ms: transition.timing.approach,
      ease: easeInFlight,
      anchor: focus,
    };
    this.invalidate();
  }

  /** The world map shown first: the screen starts white and the camera lands as soon as the map is in. */
  private coverForLanding(): void {
    this.newTransition("out").cover(
      visibleCenterPoint(this.viewport(), this.insets()),
      performance.now(),
    );
    this.heldTokens = [...this.tokens.values()].map((view) => view.data);
  }

  /**
   * The camera lands on the new map while the clouds thin out. Flying up onto the world map it starts close over
   * the party token and keeps pulling away until the whole world shows; flying down onto a scene it starts high
   * above it and comes down to its camera; both slow down as they arrive.
   */
  private land(): void {
    const transition = this.transition;
    if (!transition) return;
    const now = performance.now();
    const target = this.sceneKind === "world" ? this.fittedCamera() : this.camera;
    const party = this.sceneKind === "world" ? this.tokens.get(WORLD_PARTY_ID) : undefined;
    const focus = party
      ? {
          x: party.target.x * target.scale + target.x,
          y: party.target.y * target.scale + target.y,
        }
      : visibleCenterPoint(this.viewport(), this.insets());
    transition.flight = this.sceneKind === "world" ? "out" : "in";
    const factor =
      transition.flight === "out" ? ARENA_PASSAGE_CAMERA.landAbove : ARENA_PASSAGE_CAMERA.landBelow;
    const from = zoomAt(target, factor, focus);
    this.camera = from;
    transition.depart(focus, now);
    this.cameraTween = {
      from,
      to: target,
      start: transition.departStart,
      ms: transition.timing.depart,
      ease: easeOutFlight,
      anchor: focus,
    };
    this.invalidate();
  }

  /** Creates the clouds of the world map when it shows, and drops them when a scene takes its place. */
  private syncClouds(): void {
    if (this.sceneKind === "world" && !this.clouds) {
      this.clouds = new ArenaWorldClouds({
        lite: this.options.lite,
        board: WORLD_MAP_BOARD,
        seed: this.effectSeed++,
      });
      this.world.addChildAt(this.clouds.layer, this.world.getChildIndex(this.tokenLayer));
      this.clouds.setFogAlpha(this.fogAlpha);
      if (this.worldFog) this.clouds.setFog(this.worldFog);
      this.fitClouds();
    } else if (this.sceneKind !== "world" && this.clouds) {
      this.clouds.destroy();
      this.clouds = null;
    }
  }

  /**
   * Plays every damage and healing animation once, on the target and on the attacker, out of sight (the loading
   * screen covers the board) and at a few points of its timeline, drawing each into a tiny texture: their shaders
   * compile, their textures and filters are created and the effect code is warm, so the first real blow of the
   * session does not stall. Prepares the world map too. Once per renderer; nothing to do in the light mode (it plays
   * no rich animation).
   */
  warmEffects = (onProgress: (ratio: number) => void): Promise<void> => {
    this.warmUp();
    if (this.options.lite || this.destroyed) {
      onProgress(1);
      return Promise.resolve();
    }
    this.warmedEffects ??= this.playWarmEffects(onProgress);
    return this.warmedEffects;
  };

  private async playWarmEffects(onProgress: (ratio: number) => void): Promise<void> {
    this.heldEffects = [];
    try {
      await this.runWarmEffects(onProgress);
    } finally {
      const held = this.heldEffects;
      this.heldEffects = null;
      if (!this.destroyed) for (const effects of held) this.playEffects(effects);
    }
  }

  private async runWarmEffects(onProgress: (ratio: number) => void): Promise<void> {
    const host = this.fxHost();
    const target = RenderTexture.create({ width: 64, height: 64, resolution: 1 });
    const holder = new Container();
    const center = screenToWorld(this.camera, visibleCenterPoint(this.viewport(), this.insets()));
    holder.position.set(center.x, center.y);
    this.world.addChild(holder);
    const parts = ARENA_EFFECT_STYLES.flatMap((style) => [
      { style, attacker: false },
      { style, attacker: true },
    ]);
    for (const [index, part] of parts.entries()) {
      if (this.destroyed) break;
      try {
        this.warmEffect(part.style, part.attacker, holder, target, host);
      } catch (error) {
        console.warn(`Aquecimento do efeito ${part.style} falhou:`, error);
      }
      onProgress((index + 1) / parts.length);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    target.destroy(true);
    if (!this.destroyed) {
      holder.destroy({ children: true });
      this.fxScreen?.forget();
      this.shockwaves?.destroy();
      this.shockwaves = null;
      this.invalidate();
    }
  }

  private warmEffect(
    style: ArenaEffectStyle,
    attacker: boolean,
    holder: Container,
    target: RenderTexture,
    host: IArenaFxHost,
  ): void {
    const seed = this.effectSeed++;
    const effect = attacker
      ? createAttackerEffect(
          {
            style,
            size: ARENA_WARM_TOKEN_SIZE,
            toward: { x: ARENA_WARM_TOKEN_SIZE * 2, y: 0 },
            targetRadius: ARENA_WARM_TOKEN_SIZE / 2,
            seed,
          },
          host,
        ).effect
      : createTargetEffect(
          {
            kind: "damage",
            resource: "health",
            amount: 1,
            size: ARENA_WARM_TOKEN_SIZE,
            fontFamily: this.options.fontFamily,
            lite: false,
            seed,
            style,
          },
          host,
        );
    holder.addChild(effect.container);
    const start = performance.now();
    this.mapLayer.visible = false;
    this.tokenLayer.visible = false;
    try {
      for (const at of ARENA_WARM_STEPS_MS) {
        const { done } = effect.step(start + at, this.camera.scale, 0);
        this.app.renderer.render({ container: this.app.stage, target });
        if (done) break;
      }
    } finally {
      effect.destroy();
      this.mapLayer.visible = true;
      this.tokenLayer.visible = true;
    }
  }

  setPassages = (enabled: boolean): void => {
    this.passagesEnabled = enabled;
  };

  setWorldFog = (fog: Uint8Array | null, alpha: number): void => {
    const changed = fog !== this.worldFog;
    this.worldFog = fog;
    this.fogAlpha = alpha;
    if (this.clouds) {
      if (changed && fog) this.clouds.setFog(fog);
      this.clouds.setFogAlpha(alpha);
    }
    this.invalidate();
  };

  setBrush = (brush: IArenaWorldBrush | null): void => {
    this.brush = brush;
    if (!brush) this.paint = null;
    this.drawBrushCursor();
    this.app.canvas.style.cursor = brush ? "crosshair" : "";
    this.invalidate();
  };

  /** Keeps the cloud cover on the part of the world on screen. */
  private fitClouds(): void {
    if (!this.clouds) return;
    const { width, height } = this.viewport();
    const topLeft = screenToWorld(this.camera, { x: 0, y: 0 });
    const bottomRight = screenToWorld(this.camera, { x: width, y: height });
    this.clouds.fitView({
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    });
  }

  private drawBrushCursor(): void {
    this.brushCursor.clear();
    const brush = this.brush;
    const client = this.brushClient;
    if (!brush || !client || this.sceneKind !== "world") return;
    const rect = this.app.canvas.getBoundingClientRect();
    this.brushCursor
      .circle(client.x - rect.left, client.y - rect.top, brush.radius * this.camera.scale)
      .stroke({
        width: ARENA_BRUSH_CURSOR.width,
        color: brush.mode === "hide" ? ARENA_BRUSH_CURSOR.hide : ARENA_BRUSH_CURSOR.reveal,
        alpha: 0.9,
      });
  }

  /** Paints the fog from the last brush point to `point` (locally at once, and reported to the page). */
  private paintTo(point: IArenaPoint, first: boolean): void {
    const brush = this.brush;
    const paint = this.paint;
    if (!brush || !paint || !this.clouds) return;
    const next = clampToWorld(point);
    if (!first && distance(next, paint.last) < brush.radius * 0.2) return;
    const stroke = {
      mode: brush.mode,
      radius: brush.radius,
      points: first ? [next] : [paint.last, next],
    };
    paint.last = next;
    this.clouds.paint(stroke);
    this.options.callbacks.onFogStroke(stroke);
    this.invalidate();
  }

  private startPaint(event: FederatedPointerEvent): void {
    const point = this.worldPoint(event);
    this.paint = { pointerId: event.pointerId, last: clampToWorld(point) };
    this.paintTo(point, true);
  }

  private onCanvasLeave = (): void => {
    this.brushClient = null;
    this.drawBrushCursor();
    this.invalidate();
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
    if (this.heldTokens) {
      this.heldTokens = list;
      return;
    }
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
      view.party?.destroy();
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
    this.cameraTween = null;
    const viewport = this.viewport();
    this.camera = zoomAt(this.camera, factor, { x: viewport.width / 2, y: viewport.height / 2 });
    this.applyCamera();
  };

  fitToMap = (): void => {
    this.cameraTween = null;
    this.camera = this.fittedCamera();
    this.applyCamera();
  };

  centerOn = (tokenId: string): void => {
    const view = this.tokens.get(tokenId);
    if (!view) return;
    this.cameraTween = null;
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
    if (this.heldEffects) {
      this.heldEffects.push(effects);
      return;
    }
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
    window.clearTimeout(this.wakeTimer);
    window.clearTimeout(this.warmTimer);
    this.saveCamera();
    this.observer.disconnect();
    this.app.canvas.removeEventListener("pointerleave", this.onCanvasLeave);
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
      view.party?.destroy();
      view.party = null;
    }
    this.clouds?.destroy();
    this.clouds = null;
    this.transition?.destroy();
    this.transition = null;
    for (const { effect } of this.fading) if (!effect.container.destroyed) effect.destroy();
    this.fading = [];
    this.app.stage.removeChildren();
    this.uiLayer.destroy({ children: true });
    this.world.destroy({ children: true });
    destroyTexture(this.mapTexture);
    if (this.worldLoaded && this.worldLoaded.texture !== this.mapTexture) {
      destroyTexture(this.worldLoaded.texture);
    }
    this.worldLoaded = null;
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
      : this.urgent
        ? 0
        : this.calmAura
          ? ARENA_TURN_FRAME_MS
          : this.calmAmbient
            ? ARENA_AMBIENT_FRAME_MS
            : 0;
    if (pace > 0 && now - this.lastFrame < pace) {
      this.schedule();
      return;
    }
    this.urgent = false;
    this.lastFrame = now;
    const passing = this.stepPassage(now);
    const { animating, aura, ambient: partyAmbient } = this.stepTokens(now);
    const rippling = this.shockwaves?.step(now) ?? false;
    const clouds = this.clouds?.step(now).animating ?? false;
    this.drawSelectionFrame();
    this.app.render();
    const busy = animating || rippling || passing;
    const ambient = clouds || partyAmbient;
    this.calmAura = aura && !busy && !ambient;
    this.calmAmbient = ambient && !busy;
    if (busy || aura || ambient) this.schedule();
  };

  /**
   * Moves the camera tween and the cloud passage on; true while either still runs. While the clouds fill the screen
   * and the next map still loads, the old board is not drawn (the new one draws under the white, so its texture
   * reaches the GPU before it shows).
   */
  private stepPassage(now: number): boolean {
    let running = false;
    const tween = this.cameraTween;
    if (tween) {
      const t = Math.min(Math.max((now - tween.start) / tween.ms, 0), 1);
      this.camera = tweenCamera(tween.from, tween.to, tween.ease(t), tween.anchor);
      if (t >= 1) {
        this.camera = { ...tween.to };
        this.cameraTween = null;
      }
      this.applyCamera(false);
      running = true;
    }
    const transition = this.transition;
    if (transition) {
      if (transition.step(now).done) {
        transition.destroy();
        this.transition = null;
      } else running = true;
    }
    this.world.visible = !(this.loadingMap && this.transition?.opaque);
    return running;
  }

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

  private stepTokens(now: number): { animating: boolean; aura: boolean; ambient: boolean } {
    let animating = false;
    let auraMoving = false;
    let ambient = false;
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
      if (view.party) {
        const frame = view.party.step(now);
        ambient ||= frame.animating;
        if (frame.wakeInMs !== null) this.wakeIn(frame.wakeInMs);
      }
      view.container.position.set(display.x + dx, display.y + dy);
      view.container.scale.set(scaleX * view.screenScale, scaleY * view.screenScale);
      if (view.effects.length > 0 || view.container.filters?.length) this.applyTokenFilters(view);
    }
    return { animating: this.fadeEnded(now) || animating, aura: auraMoving, ambient };
  }

  /** Draws again in `ms` (the light mode's party token steps its color without a running loop). */
  private wakeIn(ms: number): void {
    window.clearTimeout(this.wakeTimer);
    this.wakeTimer = window.setTimeout(this.invalidate, Math.max(ms, 16));
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

  private applyCamera(userMove = true): void {
    if (userMove) this.cameraTween = null;
    const now = performance.now();
    const flying = this.cameraTween !== null;
    for (const view of this.tokens.values()) {
      if (view.data.party) this.fitPartyScreen(view);
      this.scaleLabel(view);
      if (!flying) {
        view.bars.layout(view.data.size, this.camera.scale, now, this.extentsOf(view).halfHeight);
      }
    }
    this.world.scale.set(this.camera.scale);
    this.world.position.set(this.camera.x, this.camera.y);
    this.fitClouds();
    this.drawBrushCursor();
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
    if (this.loadingMap || this.cameraTween) return;
    this.saveTimer = window.setTimeout(() => this.saveCamera(), ARENA_CAMERA_SAVE_DELAY_MS);
  }

  /**
   * Saves the camera of the scene on screen. Never while a map loads or the camera flies: the camera then still
   * frames the previous map while `sceneId` already names the next one (it is saved once the flight lands).
   */
  private saveCamera(): void {
    if (this.loadingMap || this.cameraTween) return;
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
      party: null,
      screenScale: 1,
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
    if (data.party) {
      this.drawParty(view, selected);
      return;
    }
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

  /** The party token: the cycling Othala rune instead of a portrait, with its name under it. */
  private drawParty(view: ITokenView, selected: boolean): void {
    const { data } = view;
    view.shadow
      .clear()
      .circle(0, data.size * 0.05, data.size / 2 + 2)
      .fill({ color: ARENA_COLORS.black, alpha: 0.45 });
    view.base.clear();
    view.mask.clear();
    view.ring.clear();
    view.initial?.destroy();
    view.initial = null;
    if (!view.party) {
      view.party = new ArenaPartyToken({
        host: this.fxHost(),
        lite: this.options.lite,
        seed: this.effectSeed++,
        colors: WORLD_PARTY_COLORS,
      });
      view.container.addChildAt(view.party.back, 0);
      view.container.addChildAt(view.party.body, view.container.getChildIndex(view.ring));
    }
    view.party.layout(data.size, selected);
    this.fitPartyScreen(view);
    view.label.text = data.name;
    view.label.style.fontSize = 14;
    view.label.position.set(0, data.size / 2 + ARENA_LABEL_GAP / 2);
    view.label.visible = data.label !== "hidden";
    view.label.alpha = 1;
    this.scaleLabel(view);
    view.container.alpha = 1;
    view.container.hitArea = new Circle(0, 0, data.size / 2);
    view.container.cursor = this.brush ? "crosshair" : data.controllable ? "grab" : "pointer";
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
    view.label.scale.set(labelScale(fontSize, this.camera.scale) / view.screenScale);
  }

  /** Keeps the party token readable when the camera is far and small when it is close. */
  private fitPartyScreen(view: ITokenView): void {
    const screen = view.data.size * this.camera.scale;
    const fitted = Math.min(Math.max(screen, ARENA_PARTY_SCREEN.min), ARENA_PARTY_SCREEN.max);
    view.screenScale = screen > 0 ? fitted / screen : 1;
    view.container.scale.set(view.screenScale);
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
    if (this.brush && this.clouds) {
      this.startPaint(event);
      return;
    }
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
    if (this.brush && this.clouds) {
      this.startPaint(event);
      return;
    }
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
    if (this.brush) {
      this.brushClient = this.lastClient;
      this.drawBrushCursor();
      this.invalidate();
    }
    const paint = this.paint;
    if (paint && paint.pointerId === event.pointerId) {
      this.paintTo(this.worldPoint(event), false);
      return;
    }
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
    if (this.paint && this.paint.pointerId === event.pointerId) {
      this.paint = null;
      return;
    }
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
    this.paint = null;
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
    this.app.canvas.style.cursor = this.spaceHeld ? "grab" : this.brush ? "crosshair" : "";
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
    this.cameraTween = null;
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
    this.fitClouds();
    this.invalidate();
  };
}
