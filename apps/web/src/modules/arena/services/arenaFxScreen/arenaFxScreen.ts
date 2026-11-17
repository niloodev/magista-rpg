import {
  Container,
  Rectangle,
  type Application,
  type Filter,
  type Matrix,
  type RenderTexture,
} from "pixi.js";

import {
  ARENA_FX_FIELD_MARGIN,
  type IArenaFxField,
  type IArenaFxScreen,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

/**
 * The whole screen for the few effects that take over the board (a villain's spell): a layer in screen pixels
 * above the map and the tokens, filters on the world under it (the map and the tokens, never the HUD; their
 * area is kept on the screen, in the world's own coordinates since the camera moves it, so a filter aimed at
 * a point, like a gravity pinch, takes screen coordinates), and a
 * claim so an area spell plays its screen part once even when it hits many tokens, and reservations that cap
 * how many costly pieces of one kind (a fluid per target) play at once.
 */
export class ArenaFxScreen implements IArenaFxScreen {
  readonly layer = new Container();
  private readonly filters: Filter[] = [];
  private readonly claims = new Map<string, number>();
  private readonly reservations = new Map<string, number[]>();
  private readonly area = new Rectangle();

  constructor(
    private readonly app: Application,
    private readonly world: Container,
    above?: Container,
  ) {
    this.layer.eventMode = "none";
    if (above) app.stage.addChildAt(this.layer, app.stage.getChildIndex(above) + 1);
    else app.stage.addChild(this.layer);
  }

  size = (): { width: number; height: number } => ({
    width: this.app.screen.width,
    height: this.app.screen.height,
  });

  toScreen = (container: Container): IArenaPoint2 => {
    const point = container.getGlobalPosition();
    return { x: point.x, y: point.y };
  };

  addWorldFilter = (filter: Filter): void => {
    if (this.filters.includes(filter)) return;
    this.filters.push(filter);
    this.fitWorldFilters();
    this.world.filters = [...this.filters];
  };

  removeWorldFilter = (filter: Filter): void => {
    const index = this.filters.indexOf(filter);
    if (index < 0) return;
    this.filters.splice(index, 1);
    this.world.filters = this.filters.length > 0 ? [...this.filters] : null;
    if (this.filters.length === 0) this.world.filterArea = undefined;
  };

  renderTo = (container: Container, target: RenderTexture, transform?: Matrix): void => {
    this.app.renderer.render({
      container,
      target,
      clear: true,
      clearColor: [0, 0, 0, 0],
      ...(transform ? { transform } : {}),
    });
  };

  fitWorldFilters = (): void => {
    if (this.filters.length === 0) return;
    const { width, height } = this.size();
    const a = this.world.toLocal({ x: 0, y: 0 });
    const b = this.world.toLocal({ x: width, y: height });
    this.area.x = Math.min(a.x, b.x);
    this.area.y = Math.min(a.y, b.y);
    this.area.width = Math.abs(b.x - a.x);
    this.area.height = Math.abs(b.y - a.y);
    this.world.filterArea = this.area;
  };

  field = (): IArenaFxField => {
    const { width, height } = this.size();
    const margin = Math.max(width, height) * ARENA_FX_FIELD_MARGIN;
    return {
      x: -margin,
      y: -margin,
      width: width + margin * 2,
      height: height + margin * 2,
      diagonal: Math.hypot(width + margin * 2, height + margin * 2),
    };
  };

  claim = (key: string, durationMs: number): boolean => {
    const now = performance.now();
    if ((this.claims.get(key) ?? 0) > now) return false;
    this.claims.set(key, now + durationMs);
    return true;
  };

  reserve = (key: string, limit: number, durationMs: number): boolean => {
    const now = performance.now();
    const live = (this.reservations.get(key) ?? []).filter((until) => until > now);
    const granted = live.length < limit;
    if (granted) live.push(now + durationMs);
    this.reservations.set(key, live);
    return granted;
  };

  destroy(): void {
    this.world.filters = null;
    this.layer.destroy({ children: true });
  }
}
