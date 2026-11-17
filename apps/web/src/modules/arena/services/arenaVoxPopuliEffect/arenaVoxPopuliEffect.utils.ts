import type { Graphics } from "pixi.js";

import { phase, type IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

import { VOX_COLORS, VOX_GLASS } from "./arenaVoxPopuliEffect.constants";
import type {
  IFracture,
  IFractureLine,
  IRumorCell,
  RumorCellKind,
} from "./arenaVoxPopuliEffect.types";

/**
 * Outline of a gothic window (a rectangle under a pointed arch) of the given size, centered on (0, 0), y down,
 * as points around it.
 */
export function gothicArch(width: number, height: number, samples = 18): IArenaPoint2[] {
  const half = width / 2;
  const spring = -height / 2 + width * 0.866;
  const points: IArenaPoint2[] = [
    { x: -half, y: height / 2 },
    { x: half, y: height / 2 },
    { x: half, y: spring },
  ];
  for (let index = 1; index <= samples; index += 1) {
    const a = (index / samples) * (Math.PI / 3);
    points.push({ x: -half + Math.cos(a) * width, y: spring - Math.sin(a) * width });
  }
  for (let index = samples - 1; index >= 0; index -= 1) {
    const a = (index / samples) * (Math.PI / 3);
    points.push({ x: half - Math.cos(a) * width, y: spring - Math.sin(a) * width });
  }
  return points;
}

/**
 * Distance from `origin` along `angle` to the edge of a closed polygon around it (the nearest crossing), or 0
 * when the ray misses it.
 */
export function rayToPolygon(origin: IArenaPoint2, angle: number, polygon: IArenaPoint2[]): number {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = Infinity;
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    if (!a || !b) continue;
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const denominator = dx * ey - dy * ex;
    if (Math.abs(denominator) < 1e-9) continue;
    const t = ((a.x - origin.x) * ey - (a.y - origin.y) * ex) / denominator;
    const u = ((a.x - origin.x) * dy - (a.y - origin.y) * dx) / denominator;
    if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
  }
  return Number.isFinite(best) ? best : 0;
}

const centroidOf = (points: number[]): IArenaPoint2 => {
  let x = 0;
  let y = 0;
  const count = points.length / 2;
  for (let index = 0; index < points.length; index += 2) {
    x += points[index] ?? 0;
    y += points[index + 1] ?? 0;
  }
  return { x: x / count, y: y / count };
};

const cell = (kind: RumorCellKind, points: number[], order: number, color: number): IRumorCell => ({
  kind,
  points,
  centroid: centroidOf(points),
  order,
  color,
});

const circlePoints = (center: IArenaPoint2, radius: number, samples = 24): number[] => {
  const points: number[] = [];
  for (let index = 0; index < samples; index += 1) {
    const a = (index / samples) * Math.PI * 2;
    points.push(center.x + Math.cos(a) * radius, center.y + Math.sin(a) * radius);
  }
  return points;
};

/**
 * The rumor's stained glass: a gothic window holding an all-seeing eye. Outer rays run from a ring around the
 * eye to the frame, the ring is cut in sectors, then the white of the eye (two lids), the iris and the pupil.
 * Each pane gets the moment it lights up: the rays first in a scattered order (people starting to believe),
 * then the ring, the eye and, last, the pupil (it is true).
 */
export function buildRumorCells(
  width: number,
  height: number,
  sectors: number,
  random: () => number,
): { outline: IArenaPoint2[]; eye: IArenaPoint2; cells: IRumorCell[] } {
  const outline = gothicArch(width, height);
  const eye = { x: 0, y: -height * 0.08 };
  const inner = width * 0.25;
  const ring = width * 0.36;
  const steps = 8;
  const cells: IRumorCell[] = [];
  const offset = -Math.PI / 2 + Math.PI / sectors;
  const rayOrder = Array.from({ length: sectors }, (_, index) => index).sort(() => random() - 0.5);
  for (let sector = 0; sector < sectors; sector += 1) {
    const from = offset + (sector / sectors) * Math.PI * 2;
    const to = offset + ((sector + 1) / sectors) * Math.PI * 2;
    const rays: number[] = [];
    const band: number[] = [];
    for (let step = 0; step <= steps; step += 1) {
      const a = from + ((to - from) * step) / steps;
      rays.push(eye.x + Math.cos(a) * ring, eye.y + Math.sin(a) * ring);
      band.push(eye.x + Math.cos(a) * inner, eye.y + Math.sin(a) * inner);
    }
    for (let step = steps; step >= 0; step -= 1) {
      const a = from + ((to - from) * step) / steps;
      const reach = rayToPolygon(eye, a, outline);
      rays.push(eye.x + Math.cos(a) * reach, eye.y + Math.sin(a) * reach);
      band.push(eye.x + Math.cos(a) * ring, eye.y + Math.sin(a) * ring);
    }
    const rank = rayOrder.indexOf(sector) / sectors;
    cells.push(
      cell(
        "ray",
        rays,
        rank * 0.55,
        VOX_GLASS.rays[sector % VOX_GLASS.rays.length] ?? VOX_GLASS.ruby,
      ),
    );
    cells.push(
      cell(
        "ring",
        band,
        0.58 + (sector / sectors) * 0.2,
        sector % 3 === 0 ? VOX_GLASS.gold : VOX_GLASS.crimson,
      ),
    );
  }
  const lid = (sign: number): number[] => {
    const points: number[] = [];
    for (let step = 0; step <= 16; step += 1) {
      const s = step / 16;
      const x = -inner + inner * 2 * s;
      points.push(eye.x + x, eye.y + sign * inner * 0.62 * Math.sin(Math.PI * s));
    }
    return points;
  };
  cells.push(cell("white", lid(-1), 0.82, VOX_GLASS.white));
  cells.push(cell("white", lid(1), 0.86, VOX_GLASS.white));
  cells.push(cell("iris", circlePoints(eye, inner * 0.42), 0.92, VOX_GLASS.ruby));
  cells.push(cell("pupil", circlePoints(eye, inner * 0.2), 1, VOX_GLASS.pupil));
  return { outline, eye, cells };
}

/**
 * A jagged crack from `start` along `angle`: short steps whose heading drifts a little and sometimes kinks, as
 * glass breaks.
 */
function jagged(
  start: IArenaPoint2,
  angle: number,
  length: number,
  steps: number,
  random: () => number,
): IArenaPoint2[] {
  const points = [start];
  let heading = angle;
  let { x, y } = start;
  for (let step = 0; step < steps; step += 1) {
    heading += (random() - 0.5) * 0.22 + (random() < 0.14 ? (random() - 0.5) * 0.8 : 0);
    heading += (angle - heading) * 0.25;
    const size = (length / steps) * (0.7 + random() * 0.6);
    x += Math.cos(heading) * size;
    y += Math.sin(heading) * size;
    points.push({ x, y });
  }
  return points;
}

/** The point of a crack at `share` of the way along it (by index, close enough for drawing). */
function along(points: IArenaPoint2[], share: number): IArenaPoint2 {
  const index = Math.min(Math.round(share * (points.length - 1)), points.length - 1);
  return points[index] ?? points[0] ?? { x: 0, y: 0 };
}

/**
 * A glass fracture around `center` reaching `reach`: radial cracks (jagged, a few branching), the spiderweb
 * rings joining neighbor radials at growing distances (some missing, bowed toward the center like real glass)
 * and short crushed cracks packed around the impact.
 */
export function fracturePattern(
  center: IArenaPoint2,
  reach: number,
  random: () => number,
  radials = 11,
): IFracture {
  const result: IFracture = { radials: [], rings: [], crush: [] };
  const mains: IArenaPoint2[][] = [];
  for (let index = 0; index < radials; index += 1) {
    const angle = (index / radials) * Math.PI * 2 + (random() - 0.5) * (Math.PI / radials);
    const length = reach * (0.75 + random() * 0.35);
    const points = jagged(center, angle, length, 22, random);
    mains.push(points);
    result.radials.push({ points, from: 0, width: 1 });
    if (random() < 0.6) {
      const share = 0.25 + random() * 0.4;
      const start = along(points, share);
      const turn = angle + (random() > 0.5 ? 1 : -1) * (0.35 + random() * 0.4);
      result.radials.push({
        points: jagged(start, turn, length * (0.2 + random() * 0.3), 10, random),
        from: share,
        width: 0.6,
      });
    }
  }
  for (const share of [0.06, 0.13, 0.22, 0.34, 0.5, 0.7]) {
    mains.forEach((points, index) => {
      const next = mains[(index + 1) % mains.length];
      if (!next || random() < 0.28) return;
      const a = along(points, share * (0.9 + random() * 0.2));
      const b = along(next, share * (0.9 + random() * 0.2));
      const middle = {
        x: (a.x + b.x) / 2 + (center.x - (a.x + b.x) / 2) * (0.08 + random() * 0.08),
        y: (a.y + b.y) / 2 + (center.y - (a.y + b.y) / 2) * (0.08 + random() * 0.08),
      };
      const kink = {
        x: (a.x + middle.x) / 2 + (random() - 0.5) * reach * 0.01,
        y: (a.y + middle.y) / 2 + (random() - 0.5) * reach * 0.01,
      };
      result.rings.push({ points: [a, kink, middle, b], from: share, width: 0.55 });
    });
  }
  for (let index = 0; index < 14; index += 1) {
    const angle = random() * Math.PI * 2;
    result.crush.push({
      points: jagged(center, angle, reach * (0.02 + random() * 0.05), 5, random),
      from: 0,
      width: 0.7,
    });
  }
  return result;
}

/**
 * Strokes a glass fracture revealed up to `reveal` (0 to 1): radials grow out from the impact and taper,
 * branches and spiderweb rings appear once the radials have passed where they start. Thin white cores with a
 * narrow ruby halo, so it reads as cracked glass rather than painted lines.
 */
export function strokeFracture(
  g: Graphics,
  fracture: IFracture,
  reveal: number,
  alpha: number,
  unit: number,
): void {
  if (reveal <= 0 || alpha <= 0) return;
  const grow = Math.min(reveal / 0.6, 1);
  const line = (crack: IFractureLine, shown: number, strength: number) => {
    const count = Math.max(2, Math.ceil(crack.points.length * shown));
    for (let index = 1; index < count; index += 1) {
      const a = crack.points[index - 1];
      const b = crack.points[index];
      if (!a || !b) continue;
      const taper = 1 - (index / crack.points.length) * 0.85;
      const width = unit * crack.width * taper;
      g.moveTo(a.x, a.y)
        .lineTo(b.x, b.y)
        .stroke({ width: width * 3.2, color: VOX_COLORS.ruby, alpha: 0.2 * alpha * strength });
      g.moveTo(a.x, a.y)
        .lineTo(b.x, b.y)
        .stroke({ width, color: VOX_COLORS.white, alpha: 0.95 * alpha * strength, cap: "round" });
    }
  };
  for (const crack of fracture.crush) line(crack, Math.min(reveal * 4, 1), 0.8);
  for (const crack of fracture.radials) {
    if (crack.from === 0) line(crack, grow, 1);
    else if (grow > crack.from) line(crack, phase(grow, crack.from, crack.from + 0.3), 0.8);
  }
  for (const ring of fracture.rings) {
    const shown = phase(reveal, ring.from * 0.7 + 0.15, ring.from * 0.7 + 0.3);
    if (shown > 0) line(ring, shown, 0.7);
  }
}
