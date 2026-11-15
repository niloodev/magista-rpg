import {
  clampToMap,
  type IArenaBounds,
  type IArenaPoint,
  type IMoveArenaTokenInput,
} from "@magista/shared";
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
  ARENA_FRAME_PADDING,
  ARENA_HANDLE_SIZE,
  RESIZE_CORNERS,
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
  distance,
  isEditableTarget,
  isInVisibleArea,
  parseStoredCamera,
  scaleTokenSize,
  screenToWorld,
  tokensInRect,
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
  initial: Text | null;
  mask: Graphics;
  display: IArenaPoint;
  target: IArenaPoint;
  drawnKey: string;
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
    if (sceneChanged) this.camera = this.storedCamera() ?? this.fittedCamera();
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
      const resizing = this.resize?.sizes.has(data.id) ?? false;
      view.data = resizing ? { ...data, size: view.data.size } : data;
      if (portraitChanged) this.resetPortrait(view);
      if (!this.drag?.offsets.has(data.id)) view.target = { x: data.x, y: data.y };
      if (!existing) view.display = { ...view.target };
      this.drawToken(view);
      this.tokenLayer.addChild(view.container);
    }
    for (const [id, view] of this.tokens) {
      if (seen.has(id)) continue;
      view.container.destroy({ children: true });
      this.tokens.delete(id);
      this.drag?.offsets.delete(id);
    }
    for (const id of this.drag?.offsets.keys() ?? []) {
      const dragged = this.tokens.get(id);
      if (dragged) this.tokenLayer.addChild(dragged.container);
    }
    this.invalidate();
  };

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

  visibleCenter = (): IArenaPoint =>
    screenToWorld(this.camera, visibleCenterPoint(this.viewport(), this.insets()));

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
    this.app.stage.removeChildren();
    this.uiLayer.destroy({ children: true });
    this.world.destroy({ children: true });
    this.mapTexture?.destroy(true);
    for (const pending of this.portraits.values())
      void pending.then((texture) => texture?.destroy(true));
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
    this.drawSelectionFrame();
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
    const selected = this.selection.has(data.id);
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

  private startPan(event: FederatedPointerEvent): void {
    this.pan = {
      pointerId: event.pointerId,
      start: { x: event.global.x, y: event.global.y },
      camera: { ...this.camera },
      moved: false,
    };
    this.app.canvas.style.cursor = "grabbing";
  }

  private onTokenDown(tokenId: string, event: FederatedPointerEvent): void {
    event.stopPropagation();
    this.trackPointer(event);
    if (this.pinch) return;
    if (this.wantsPan(event)) {
      this.startPan(event);
      return;
    }
    if (event.button !== 0) return;
    if (event.shiftKey) {
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
      additive: event.shiftKey,
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
      this.options.callbacks.onDragMove(drag.moves);
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
      const radius = view.data.size / 2;
      const labelHeight = ARENA_LABEL_GAP + view.label.height;
      const { x, y } = view.display;
      box = box
        ? {
            left: Math.min(box.left, x - radius),
            top: Math.min(box.top, y - radius),
            right: Math.max(box.right, x + radius),
            bottom: Math.max(box.bottom, y + radius + labelHeight),
          }
        : {
            left: x - radius,
            top: y - radius,
            right: x + radius,
            bottom: y + radius + labelHeight,
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
    if (this.drag?.moved) {
      const originals = [...this.drag.offsets.keys()].flatMap((tokenId) => {
        const view = this.tokens.get(tokenId);
        return view ? [{ tokenId, x: view.data.x, y: view.data.y }] : [];
      });
      if (originals.length > 0) this.options.callbacks.onDragMove(originals);
    }
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
