import {
  WORLD_FOG_BYTES,
  WORLD_FOG_CELL,
  WORLD_FOG_COLUMNS,
  WORLD_FOG_ROWS,
  WORLD_MAP_BOARD,
} from "../../schemas/arena";
import type { IWorldFogStroke, IWorldPoint, WorldFogMode } from "../../schemas/arena";
import type { IArenaControlViewer } from "../arena";

/** A fog mask with every cell clear. */
export function emptyFogMask(): Uint8Array {
  return new Uint8Array(WORLD_FOG_BYTES);
}

/** A fog mask with every cell covered ("hide") or clear ("reveal"). */
export function fillFog(mode: WorldFogMode): Uint8Array {
  const mask = new Uint8Array(WORLD_FOG_BYTES);
  if (mode === "reveal") return mask;
  for (let cell = 0; cell < WORLD_FOG_COLUMNS * WORLD_FOG_ROWS; cell += 1)
    setCell(mask, cell, true);
  return mask;
}

/** Whether a fog cell (by column and row) is covered. Cells outside the grid are clear. */
export function isFogCovered(mask: Uint8Array, column: number, row: number): boolean {
  if (column < 0 || row < 0 || column >= WORLD_FOG_COLUMNS || row >= WORLD_FOG_ROWS) return false;
  const cell = row * WORLD_FOG_COLUMNS + column;
  return ((mask[cell >> 3] ?? 0) & (1 << (cell & 7))) !== 0;
}

function setCell(mask: Uint8Array, cell: number, covered: boolean): void {
  const index = cell >> 3;
  const bit = 1 << (cell & 7);
  mask[index] = covered ? (mask[index] ?? 0) | bit : (mask[index] ?? 0) & ~bit;
}

function distanceToSegment(px: number, py: number, a: IWorldPoint, b: IWorldPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t =
    length === 0 ? 0 : Math.min(Math.max(((px - a.x) * dx + (py - a.y) * dy) / length, 0), 1);
  return Math.hypot(px - (a.x + dx * t), py - (a.y + dy * t));
}

/**
 * Paints a brush batch over the fog: every cell whose center is within `radius` of the stroke (a disc on each
 * point and a capsule between consecutive points) is covered ("hide") or cleared ("reveal"). Returns a new mask.
 */
export function paintFog(mask: Uint8Array, stroke: IWorldFogStroke): Uint8Array {
  const next = Uint8Array.from(mask);
  const covered = stroke.mode === "hide";
  const { points, radius } = stroke;
  const first = points[0];
  if (!first) return next;
  const segments = points.length === 1 ? [[first, first] as const] : [];
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    if (from && to) segments.push([from, to] as const);
  }
  for (const [a, b] of segments) {
    const minColumn = Math.max(Math.floor((Math.min(a.x, b.x) - radius) / WORLD_FOG_CELL), 0);
    const maxColumn = Math.min(
      Math.floor((Math.max(a.x, b.x) + radius) / WORLD_FOG_CELL),
      WORLD_FOG_COLUMNS - 1,
    );
    const minRow = Math.max(Math.floor((Math.min(a.y, b.y) - radius) / WORLD_FOG_CELL), 0);
    const maxRow = Math.min(
      Math.floor((Math.max(a.y, b.y) + radius) / WORLD_FOG_CELL),
      WORLD_FOG_ROWS - 1,
    );
    for (let row = minRow; row <= maxRow; row += 1) {
      const cy = (row + 0.5) * WORLD_FOG_CELL;
      for (let column = minColumn; column <= maxColumn; column += 1) {
        const cx = (column + 0.5) * WORLD_FOG_CELL;
        if (distanceToSegment(cx, cy, a, b) <= radius) {
          setCell(next, row * WORLD_FOG_COLUMNS + column, covered);
        }
      }
    }
  }
  return next;
}

/** The fog mask in base64 (what the API stores in the view and sends over the socket). */
export function encodeFogMask(mask: Uint8Array): string {
  let binary = "";
  for (const byte of mask) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** A fog mask from base64; anything with the wrong size becomes a clear mask. */
export function decodeFogMask(encoded: string | null | undefined): Uint8Array {
  if (!encoded) return emptyFogMask();
  try {
    const binary = atob(encoded);
    if (binary.length !== WORLD_FOG_BYTES) return emptyFogMask();
    const mask = new Uint8Array(WORLD_FOG_BYTES);
    for (let index = 0; index < binary.length; index += 1) mask[index] = binary.charCodeAt(index);
    return mask;
  } catch {
    return emptyFogMask();
  }
}

/** The fog as one byte per cell (255 covered, 0 clear), row by row: the texture the web draws the clouds from. */
export function fogCellValues(mask: Uint8Array): Uint8Array {
  const values = new Uint8Array(WORLD_FOG_COLUMNS * WORLD_FOG_ROWS);
  for (let cell = 0; cell < values.length; cell += 1) {
    values[cell] = ((mask[cell >> 3] ?? 0) & (1 << (cell & 7))) !== 0 ? 255 : 0;
  }
  return values;
}

/** The GM always moves the party token; a player only while the world map is live. */
export function canMoveParty(viewer: IArenaControlViewer, worldLive: boolean): boolean {
  return viewer.role === "GM" || worldLive;
}

/** A point kept inside the world map. */
export function clampToWorld(point: IWorldPoint): IWorldPoint {
  return {
    x: Math.min(Math.max(point.x, 0), WORLD_MAP_BOARD.width),
    y: Math.min(Math.max(point.y, 0), WORLD_MAP_BOARD.height),
  };
}

/** Where the party starts: the middle of the world map. */
export function defaultPartyPosition(): IWorldPoint {
  return { x: WORLD_MAP_BOARD.width / 2, y: WORLD_MAP_BOARD.height / 2 };
}
