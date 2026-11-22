import {
  WORLD_FOG_CELL,
  WORLD_FOG_COLUMNS,
  WORLD_FOG_ROWS,
  emptyFogMask,
  paintFog,
} from "@magista/shared";
import { BufferImageSource, Container, Mesh, MeshGeometry, Shader, Texture } from "pixi.js";

import { colorChannels } from "@/modules/arena/services/arenaEnergyFlow";

import {
  CLOUD_VERTEX,
  WORLD_CLOUD_COLORS,
  WORLD_CLOUD_SCALE,
  WORLD_COVER_FRAGMENT,
  WORLD_EDGE_FEATHER,
  WORLD_FOG_FADE_LITE_MS,
  WORLD_FOG_FADE_MS,
  WORLD_PUFF_SCALE,
  WORLD_SHADOW,
  WORLD_WIND,
} from "./arenaWorldClouds.constants";
import type {
  IArenaWorldCloudsOptions,
  IWorldFogStroke,
  IWorldRect,
} from "./arenaWorldClouds.types";
import {
  cloudSeaUniforms,
  coverageGoal,
  stepCoverage,
  writeCoverage,
} from "./arenaWorldClouds.utils";

interface ICoverUniforms {
  uTime: number;
  uFogAlpha: number;
}

const CELLS = WORLD_FOG_COLUMNS * WORLD_FOG_ROWS;

/**
 * The sky of the world map: a sea of white clouds seen from above, lit by the sun from the top left, drifting with
 * the wind and slowly changing shape. One mesh (fitted to the visible world, so it never ends) draws it everywhere
 * past the edges of the map and over the fog cells the GM painted, which is what hides them from the players;
 * where the map shows, the clouds cast a soft shadow on it. The edge of the fog is made of puffs that boil as the
 * clouds move, and a cell covering or clearing grows or melts in cloud shapes. In the light mode the sky stands
 * still and only redraws when something changes.
 */
export class ArenaWorldClouds {
  readonly layer = new Container();
  private readonly cover: Mesh<MeshGeometry, Shader>;
  private readonly coverUniforms: ICoverUniforms;
  private readonly coverResources: Record<string, unknown>;
  private readonly fogBytes = new Uint8Array(CELLS * 4);
  private readonly fogSource: BufferImageSource;
  private readonly fogTexture: Texture;
  private readonly cells = new Float32Array(CELLS);
  private readonly positions = new Float32Array(8);
  private readonly goal = new Float32Array(CELLS);
  private mask = emptyFogMask();
  private ready = false;
  private fading = false;
  private readonly start = performance.now();
  private lastSeconds = 0;

  constructor(private readonly options: IArenaWorldCloudsOptions) {
    const { board, seed } = options;
    this.layer.eventMode = "none";
    this.fogSource = new BufferImageSource({
      resource: this.fogBytes,
      width: WORLD_FOG_COLUMNS,
      height: WORLD_FOG_ROWS,
      format: "rgba8unorm",
      scaleMode: "linear",
    });
    this.fogTexture = new Texture({ source: this.fogSource });
    const shader = Shader.from({
      gl: { vertex: CLOUD_VERTEX, fragment: WORLD_COVER_FRAGMENT },
      resources: {
        uFog: this.fogSource,
        coverUniforms: {
          uBoard: { value: new Float32Array([board.width, board.height]), type: "vec2<f32>" },
          uCell: {
            value: new Float32Array([WORLD_FOG_CELL / board.width, WORLD_FOG_CELL / board.height]),
            type: "vec2<f32>",
          },
          uTime: { value: 0, type: "f32" },
          uFogAlpha: { value: 1, type: "f32" },
          uFeather: { value: WORLD_EDGE_FEATHER, type: "f32" },
          uScale: { value: WORLD_CLOUD_SCALE, type: "f32" },
          uSeed: { value: (seed % 53) * 1.13, type: "f32" },
          uWind: { value: new Float32Array([WORLD_WIND.x, WORLD_WIND.y]), type: "vec2<f32>" },
          uShadowReach: { value: WORLD_SHADOW.reach, type: "f32" },
          uPuff: { value: WORLD_PUFF_SCALE, type: "f32" },
          uShadowAlpha: { value: WORLD_SHADOW.alpha, type: "f32" },
          uShadow: {
            value: new Float32Array(colorChannels(WORLD_CLOUD_COLORS.shadow)),
            type: "vec3<f32>",
          },
          ...cloudSeaUniforms(),
        },
      },
    });
    this.coverResources = shader.resources;
    this.coverUniforms = (shader.resources.coverUniforms as { uniforms: ICoverUniforms }).uniforms;
    this.cover = new Mesh({
      geometry: new MeshGeometry({
        positions: new Float32Array(8),
        uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
        indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
      }),
      shader,
    });
    this.cover.eventMode = "none";
    this.layer.addChild(this.cover);
    writeCoverage(this.cells, this.fogBytes);
    this.fogSource.update();
  }

  /**
   * Shows a new fog mask (from the server). The first one shows at once; later ones cover or clear the cells that
   * changed, growing or melting in cloud shapes.
   */
  setFog(mask: Uint8Array): void {
    this.mask = Uint8Array.from(mask);
    this.applyGoal(!this.ready);
    this.ready = true;
  }

  /** Paints a brush batch locally at once (the GM's own stroke shows before the server answers). */
  paint(stroke: IWorldFogStroke): void {
    this.mask = paintFog(this.mask, stroke);
    this.applyGoal(false);
  }

  /** How strongly the fog over the map shows (the GM sees it translucent); past the edges it is always whole. */
  setFogAlpha(alpha: number): void {
    this.coverUniforms.uFogAlpha = alpha;
  }

  /** Fits the cover to the part of the world on screen (call when the camera or the screen changes). */
  fitView(rect: IWorldRect): void {
    const { x, y, width, height } = rect;
    this.positions.set([x, y, x + width, y, x + width, y + height, x, y + height]);
    this.cover.geometry.positions = this.positions;
  }

  /** Advances the clouds to `now`; `animating` says the loop should keep drawing. */
  step(now: number): { animating: boolean } {
    const seconds = (now - this.start) / 1000;
    const delta = Math.max(seconds - this.lastSeconds, 0);
    this.lastSeconds = seconds;
    if (this.fading) {
      const fade = this.options.lite ? WORLD_FOG_FADE_LITE_MS : WORLD_FOG_FADE_MS;
      this.fading = stepCoverage(this.cells, this.goal, (delta * 1000) / fade);
      writeCoverage(this.cells, this.fogBytes);
      this.fogSource.update();
    }
    if (this.options.lite) return { animating: this.fading };
    this.coverUniforms.uTime = seconds;
    return { animating: true };
  }

  destroy(): void {
    this.coverResources.uFog = Texture.EMPTY.source;
    const { geometry, shader } = this.cover;
    this.cover.destroy();
    geometry.destroy();
    shader?.destroy();
    this.fogTexture.destroy(true);
    this.layer.destroy({ children: true });
  }

  private applyGoal(instant: boolean): void {
    coverageGoal(this.mask, this.goal);
    if (!instant) {
      this.fading = true;
      return;
    }
    this.cells.set(this.goal);
    writeCoverage(this.cells, this.fogBytes);
    this.fogSource.update();
  }
}
