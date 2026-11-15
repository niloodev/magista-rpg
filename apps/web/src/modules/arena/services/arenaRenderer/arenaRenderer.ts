import { clampToMap, type IArenaBounds, type IArenaPoint } from "@magista/shared";
import {
  Application,
  Circle,
  Container,
  type FederatedPointerEvent,
  Graphics,
  Sprite,
  Text,
  Texture,
} from "pixi.js";

import { fetchMediaBlob } from "@/core/services/http";
import { ARENA_EMPTY_BOUNDS } from "@/modules/arena/arena.constants";

import {
  ARENA_CAMERA_SAVE_DELAY_MS,
  ARENA_CAMERA_STORAGE_PREFIX,
  ARENA_CLICK_SLOP,
  ARENA_COLORS,
  ARENA_LABEL_GAP,
  ARENA_LABEL_MIN_SCREEN_PX,
  ARENA_LITE_FRAME_MS,
  ARENA_SETTLE_DISTANCE,
  ARENA_TOKEN_LERP,
  ARENA_TOKEN_TEXTURE_SIZE,
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
  centerCamera,
  fitCamera,
  fitTextureSize,
  parseStoredCamera,
  screenToWorld,
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
  initial: Text | null;
  mask: Graphics;
  display: IArenaPoint;
  target: IArenaPoint;
  drawnKey: string;
}

interface IDragState {
  tokenId: string;
  pointerId: number;
  offset: IArenaPoint;
  start: IArenaPoint;
  point: IArenaPoint;
  moved: boolean;
}

interface IPanState {
  pointerId: number;
  start: IArenaPoint;
  camera: IArenaCamera;
  moved: boolean;
}

/**
 * Decodes an image from the API into a GPU texture no larger than `maxSize` (old cards stop at 4096), keeping
 * the original size so coordinates stay in pixels of the original image.
 */
async function loadTexture(url: string, maxSize: number): Promise<ILoadedTexture<Texture>> {
  const blob = await fetchMediaBlob(url);
  const original = await createImageBitmap(blob);
  const target = fitTextureSize(original.width, original.height, maxSize);
  const bitmap = target.scaled
    ? await createImageBitmap(blob, {
        resizeWidth: target.width,
        resizeHeight: target.height,
        resizeQuality: "high",
      })
    : original;
  if (bitmap !== original) original.close();
  return { texture: Texture.from(bitmap, true), width: original.width, height: original.height };
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
  private readonly pointers = new Map<number, IArenaPoint>();
  private readonly observer: ResizeObserver;
  private camera: IArenaCamera = { x: 0, y: 0, scale: 1 };
  private bounds: IArenaBounds = ARENA_EMPTY_BOUNDS;
  private sceneId: string | null = null;
  private mapUrl: string | null | undefined = undefined;
  private scene: IArenaRenderScene | null = null;
  private mapTexture: Texture | null = null;
  private selection: string | null = null;
  private drag: IDragState | null = null;
  private pan: IPanState | null = null;
  private pinch: { distance: number; camera: IArenaCamera } | null = null;
  private frame = 0;
  private lastFrame = 0;
  private saveTimer = 0;
  private sceneVersion = 0;
  private destroyed = false;

  private constructor(
    private readonly app: Application,
    private readonly host: HTMLElement,
    private readonly options: IArenaRendererOptions,
    private readonly maxTextureSize: number,
  ) {
    this.world.addChild(this.mapLayer, this.tokenLayer);
    app.stage.addChild(this.world);
    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;
    app.stage.on("pointerdown", this.onStageDown);
    app.stage.on("globalpointermove", this.onPointerMove);
    app.stage.on("pointerup", this.onPointerUp);
    app.stage.on("pointerupoutside", this.onPointerUp);
    app.stage.on("pointercancel", this.onPointerCancel);
    app.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    app.canvas.addEventListener("contextmenu", this.preventMenu);
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
    const maxTexture = gl ? (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) : 4096;
    return new ArenaRenderer(app, host, options, maxTexture);
  }

  setScene = async (scene: IArenaRenderScene | null): Promise<void> => {
    const sceneChanged = (scene?.id ?? null) !== this.sceneId;
    const mapUrl = scene?.mapUrl ?? null;
    if (!sceneChanged && mapUrl === this.mapUrl) return;
    const version = ++this.sceneVersion;
    this.scene = scene;
    this.sceneId = scene?.id ?? null;
    this.mapUrl = mapUrl;
    let loaded: ILoadedTexture<Texture> | null = null;
    if (mapUrl) {
      loaded = await loadTexture(mapUrl, this.maxTextureSize).catch(() => null);
      if (this.destroyed || version !== this.sceneVersion) {
        loaded?.texture.destroy(true);
        return;
      }
      if (!loaded) this.mapUrl = undefined;
    }
    this.options.callbacks.onMapError(Boolean(mapUrl) && !loaded);
    this.mapLayer.removeChildren().forEach((child) => child.destroy());
    this.mapTexture?.destroy(true);
    this.mapTexture = loaded?.texture ?? null;
    if (loaded) {
      const sprite = new Sprite(loaded.texture);
      sprite.width = loaded.width;
      sprite.height = loaded.height;
      this.mapLayer.addChild(sprite);
      this.bounds = { width: loaded.width, height: loaded.height };
    } else {
      this.bounds = ARENA_EMPTY_BOUNDS;
      this.mapLayer.addChild(this.drawEmptyGround());
    }
    if (sceneChanged)
      this.camera =
        this.storedCamera() ?? fitCamera(this.bounds, this.viewport(), this.options.insetTop);
    this.applyCamera();
    this.options.callbacks.onSceneReady(this.bounds);
  };

  setTokens = (list: IArenaRenderToken[]): void => {
    const seen = new Set<string>();
    for (const data of list) {
      seen.add(data.id);
      const existing = this.tokens.get(data.id);
      const view = existing ?? this.createToken(data);
      const portraitChanged = existing !== undefined && existing.data.imageUrl !== data.imageUrl;
      view.data = data;
      if (portraitChanged) this.resetPortrait(view);
      if (this.drag?.tokenId !== data.id) view.target = { x: data.x, y: data.y };
      if (!existing) view.display = { ...view.target };
      this.drawToken(view);
      this.tokenLayer.addChild(view.container);
    }
    for (const [id, view] of this.tokens) {
      if (seen.has(id)) continue;
      view.container.destroy({ children: true });
      this.tokens.delete(id);
      if (this.drag?.tokenId === id) this.drag = null;
    }
    const dragged = this.drag ? this.tokens.get(this.drag.tokenId) : null;
    if (dragged) this.tokenLayer.addChild(dragged.container);
    this.invalidate();
  };

  setSelection = (tokenId: string | null): void => {
    if (this.selection === tokenId) return;
    this.selection = tokenId;
    for (const view of this.tokens.values()) this.drawToken(view);
    this.invalidate();
  };

  zoomBy = (factor: number): void => {
    const viewport = this.viewport();
    this.camera = zoomAt(this.camera, factor, { x: viewport.width / 2, y: viewport.height / 2 });
    this.applyCamera();
  };

  fitToMap = (): void => {
    this.camera = fitCamera(this.bounds, this.viewport(), this.options.insetTop);
    this.applyCamera();
  };

  centerOn = (tokenId: string): void => {
    const view = this.tokens.get(tokenId);
    if (!view) return;
    this.camera = centerCamera(this.camera, view.target, this.viewport(), this.options.insetTop);
    this.applyCamera();
  };

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
    this.app.stage.removeChildren();
    this.world.destroy({ children: true });
    this.mapTexture?.destroy(true);
    for (const pending of this.portraits.values())
      void pending.then((texture) => texture?.destroy(true));
    this.portraits.clear();
    this.app.destroy({ removeView: true });
  };

  private viewport() {
    return { width: this.app.screen.width, height: this.app.screen.height };
  }

  private invalidate = (): void => {
    if (this.destroyed || this.frame) return;
    this.frame = requestAnimationFrame(this.tick);
  };

  private tick = (now: number): void => {
    this.frame = 0;
    if (this.options.lite && now - this.lastFrame < ARENA_LITE_FRAME_MS) {
      this.invalidate();
      return;
    }
    this.lastFrame = now;
    const animating = this.stepTokens();
    this.app.render();
    if (animating) this.invalidate();
  };

  private stepTokens(): boolean {
    let animating = false;
    const factor = this.options.lite ? 1 : ARENA_TOKEN_LERP;
    for (const view of this.tokens.values()) {
      const { display, target } = view;
      if (display.x !== target.x || display.y !== target.y) {
        display.x = approach(display.x, target.x, factor, ARENA_SETTLE_DISTANCE);
        display.y = approach(display.y, target.y, factor, ARENA_SETTLE_DISTANCE);
        animating ||= display.x !== target.x || display.y !== target.y;
      }
      view.container.position.set(display.x, display.y);
    }
    return animating;
  }

  private applyCamera(): void {
    for (const view of this.tokens.values()) this.scaleLabel(view);
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

  private drawEmptyGround(): Graphics {
    const { width, height } = ARENA_EMPTY_BOUNDS;
    return new Graphics()
      .rect(0, 0, width, height)
      .fill({ color: ARENA_COLORS.void800 })
      .stroke({ width: 4, color: ARENA_COLORS.ruby500, alpha: 0.25 });
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
    container.addChild(shadow, base, mask, ring, label);
    container.eventMode = "static";
    container.on("pointerdown", (event: FederatedPointerEvent) => this.onTokenDown(data.id, event));
    const view: ITokenView = {
      data,
      container,
      shadow,
      base,
      ring,
      label,
      portrait: null,
      initial: null,
      mask,
      display: { x: data.x, y: data.y },
      target: { x: data.x, y: data.y },
      drawnKey: "",
    };
    this.tokens.set(data.id, view);
    void this.attachPortrait(view);
    return view;
  }

  private resetPortrait(view: ITokenView): void {
    view.portrait?.destroy();
    view.portrait = null;
    view.drawnKey = "";
    void this.attachPortrait(view);
  }

  private async attachPortrait(view: ITokenView): Promise<void> {
    const url = view.data.imageUrl;
    if (!url) return;
    let pending = this.portraits.get(url);
    if (!pending) {
      pending = loadTexture(url, ARENA_TOKEN_TEXTURE_SIZE)
        .then((loaded) => loaded.texture)
        .catch(() => null);
      this.portraits.set(url, pending);
    }
    const texture = await pending;
    if (!texture || this.destroyed || view.container.destroyed || view.data.imageUrl !== url)
      return;
    view.portrait?.destroy();
    view.portrait = new Sprite(texture);
    view.portrait.anchor.set(0.5);
    view.portrait.mask = view.mask;
    view.container.addChildAt(view.portrait, view.container.getChildIndex(view.ring));
    view.drawnKey = "";
    this.drawToken(view);
    this.invalidate();
  }

  private drawToken(view: ITokenView): void {
    const { data } = view;
    const selected = this.selection === data.id;
    const key = [data.size, data.name, data.tone, data.hidden, selected, !!view.portrait].join("|");
    if (key === view.drawnKey) return;
    view.drawnKey = key;
    const radius = data.size / 2;
    const ringWidth = Math.max(3, data.size * 0.045);
    const ringColor = selected
      ? ARENA_COLORS.gold400
      : data.tone === "own"
        ? ARENA_COLORS.ruby500
        : ARENA_COLORS.teal400;
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
      view.portrait.width = data.size;
      view.portrait.height = data.size;
      view.initial?.destroy();
      view.initial = null;
    } else {
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
    view.label.position.set(0, radius + ARENA_LABEL_GAP);
    this.scaleLabel(view);
    view.container.alpha = data.hidden ? 0.5 : 1;
    view.container.hitArea = new Circle(0, 0, radius);
    view.container.cursor = data.controllable ? "grab" : "pointer";
  }

  private scaleLabel(view: ITokenView): void {
    const fontSize = Number(view.label.style.fontSize) || ARENA_LABEL_MIN_SCREEN_PX;
    view.label.scale.set(Math.max(1, ARENA_LABEL_MIN_SCREEN_PX / (fontSize * this.camera.scale)));
  }

  private worldPoint(event: FederatedPointerEvent): IArenaPoint {
    return screenToWorld(this.camera, { x: event.global.x, y: event.global.y });
  }

  private trackPointer(event: FederatedPointerEvent): void {
    this.pointers.set(event.pointerId, { x: event.global.x, y: event.global.y });
    if (this.pointers.size === 2) {
      this.drag = null;
      this.pan = null;
      this.pinch = { distance: this.pointerDistance(), camera: { ...this.camera } };
    }
  }

  private pointerDistance(): number {
    const [first, second] = [...this.pointers.values()];
    if (!first || !second) return 0;
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  private onTokenDown(tokenId: string, event: FederatedPointerEvent): void {
    event.stopPropagation();
    this.trackPointer(event);
    if (this.pinch) return;
    this.options.callbacks.onSelect(tokenId);
    const view = this.tokens.get(tokenId);
    if (!view || !view.data.controllable || event.button !== 0) return;
    const point = this.worldPoint(event);
    this.drag = {
      tokenId,
      pointerId: event.pointerId,
      offset: { x: point.x - view.target.x, y: point.y - view.target.y },
      start: { x: event.global.x, y: event.global.y },
      point: { ...view.target },
      moved: false,
    };
    view.container.cursor = "grabbing";
    this.tokenLayer.addChild(view.container);
  }

  private onStageDown = (event: FederatedPointerEvent): void => {
    this.trackPointer(event);
    if (this.pinch || event.button === 2) return;
    this.pan = {
      pointerId: event.pointerId,
      start: { x: event.global.x, y: event.global.y },
      camera: { ...this.camera },
      moved: false,
    };
  };

  private onPointerMove = (event: FederatedPointerEvent): void => {
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
    const drag = this.drag;
    if (drag && drag.pointerId === event.pointerId) {
      const view = this.tokens.get(drag.tokenId);
      if (!view) return;
      const travel = Math.hypot(event.global.x - drag.start.x, event.global.y - drag.start.y);
      if (!drag.moved && travel < ARENA_CLICK_SLOP) return;
      drag.moved = true;
      const world = this.worldPoint(event);
      drag.point = clampToMap(
        { x: world.x - drag.offset.x, y: world.y - drag.offset.y },
        this.bounds,
      );
      view.target = { ...drag.point };
      view.display = { ...drag.point };
      this.options.callbacks.onDragMove(drag.tokenId, drag.point);
      this.invalidate();
      return;
    }
    const pan = this.pan;
    if (pan && pan.pointerId === event.pointerId) {
      const dx = event.global.x - pan.start.x;
      const dy = event.global.y - pan.start.y;
      if (!pan.moved && Math.hypot(dx, dy) < ARENA_CLICK_SLOP) return;
      pan.moved = true;
      this.camera = { ...pan.camera, x: pan.camera.x + dx, y: pan.camera.y + dy };
      this.applyCamera();
    }
  };

  private onPointerUp = (event: FederatedPointerEvent): void => {
    this.pointers.delete(event.pointerId);
    if (this.pinch) {
      if (this.pointers.size < 2) this.pinch = null;
      return;
    }
    const drag = this.drag;
    if (drag && drag.pointerId === event.pointerId) {
      this.drag = null;
      const view = this.tokens.get(drag.tokenId);
      if (view) {
        view.container.cursor = view.data.controllable ? "grab" : "pointer";
        if (drag.moved) this.options.callbacks.onDrop(drag.tokenId, drag.point);
      }
      return;
    }
    const pan = this.pan;
    if (pan && pan.pointerId === event.pointerId) {
      this.pan = null;
      if (!pan.moved) this.options.callbacks.onSelect(null);
    }
  };

  private onPointerCancel = (event: FederatedPointerEvent): void => {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (this.drag?.pointerId === event.pointerId) {
      const view = this.tokens.get(this.drag.tokenId);
      if (view) {
        view.container.cursor = view.data.controllable ? "grab" : "pointer";
        view.target = { x: view.data.x, y: view.data.y };
        this.invalidate();
      }
      this.drag = null;
    }
    if (this.pan?.pointerId === event.pointerId) this.pan = null;
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
