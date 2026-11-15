import {
  ARENA_TOKEN_SIZE_MAX,
  ARENA_TOKEN_SIZE_MIN,
  type IArenaBounds,
  type IArenaPoint,
} from "@magista/shared";

import {
  ARENA_COMPACT_WIDTH,
  ARENA_FIT_PADDING,
  ARENA_FIT_PADDING_COMPACT,
  ARENA_ZOOM_MAX,
  ARENA_ZOOM_MIN,
} from "./arenaRenderer.constants";
import type { IArenaCamera, IArenaViewport } from "./arenaRenderer.types";

/**
 * Keeps the zoom inside the allowed range.
 */
export function clampZoom(scale: number): number {
  return Math.min(Math.max(scale, ARENA_ZOOM_MIN), ARENA_ZOOM_MAX);
}

/**
 * Camera that shows the whole map centered in the viewport, with some breathing room.
 */
export function fitCamera(
  bounds: IArenaBounds,
  viewport: IArenaViewport,
  insetTop = 0,
  insetBottom = 0,
  insetRight = 0,
  insetLeft = 0,
): IArenaCamera {
  const visibleHeight = Math.max(viewport.height - insetTop - insetBottom, 1);
  const visibleWidth = Math.max(viewport.width - insetRight - insetLeft, 1);
  const padding =
    viewport.width < ARENA_COMPACT_WIDTH ? ARENA_FIT_PADDING_COMPACT : ARENA_FIT_PADDING;
  const usableWidth = Math.max(visibleWidth - padding * 2, 1);
  const usableHeight = Math.max(visibleHeight - padding * 2, 1);
  const scale = clampZoom(Math.min(usableWidth / bounds.width, usableHeight / bounds.height));
  return {
    scale,
    x: insetLeft + (visibleWidth - bounds.width * scale) / 2,
    y: insetTop + (visibleHeight - bounds.height * scale) / 2,
  };
}

/**
 * Zooms by a factor keeping the map point under the given screen point still.
 */
export function zoomAt(camera: IArenaCamera, factor: number, screen: IArenaPoint): IArenaCamera {
  const scale = clampZoom(camera.scale * factor);
  const world = screenToWorld(camera, screen);
  return { scale, x: screen.x - world.x * scale, y: screen.y - world.y * scale };
}

/**
 * Converts a screen point (CSS pixels of the canvas) to map pixels.
 */
export function screenToWorld(camera: IArenaCamera, screen: IArenaPoint): IArenaPoint {
  return { x: (screen.x - camera.x) / camera.scale, y: (screen.y - camera.y) / camera.scale };
}

/**
 * Camera that puts a map point at the center of the viewport, keeping the zoom.
 */
export function centerCamera(
  camera: IArenaCamera,
  world: IArenaPoint,
  viewport: IArenaViewport,
  insetTop = 0,
  insetRight = 0,
  insetLeft = 0,
): IArenaCamera {
  return {
    scale: camera.scale,
    x: insetLeft + (viewport.width - insetRight - insetLeft) / 2 - world.x * camera.scale,
    y: insetTop + (viewport.height - insetTop) / 2 - world.y * camera.scale,
  };
}

/**
 * Moves a value toward its target; snaps once close enough.
 */
export function approach(current: number, target: number, factor: number, settle: number) {
  const next = current + (target - current) * factor;
  return Math.abs(target - next) <= settle ? target : next;
}

/**
 * Reads a camera saved on this device, ignoring anything malformed.
 */
export function parseStoredCamera(raw: string | null): IArenaCamera | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { x, y, scale } = value as Record<string, unknown>;
    if (typeof x !== "number" || typeof y !== "number" || typeof scale !== "number") return null;
    if (![x, y, scale].every(Number.isFinite)) return null;
    return { x, y, scale: clampZoom(scale) };
  } catch {
    return null;
  }
}

/**
 * Size to decode an image at so it fits the GPU texture limit (old cards stop at 4096).
 */
export function fitTextureSize(width: number, height: number, max: number) {
  const largest = Math.max(width, height);
  if (largest <= max) return { width, height, scaled: false };
  const ratio = max / largest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
    scaled: true,
  };
}

/**
 * Distance between two points.
 */
export function distance(a: IArenaPoint, b: IArenaPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Ids of the tokens whose center lies inside the rectangle spanned by two corners (any order).
 */
export function tokensInRect(
  tokens: { id: string; x: number; y: number }[],
  a: IArenaPoint,
  b: IArenaPoint,
): string[] {
  const left = Math.min(a.x, b.x);
  const right = Math.max(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const bottom = Math.max(a.y, b.y);
  return tokens
    .filter((token) => token.x >= left && token.x <= right && token.y >= top && token.y <= bottom)
    .map((token) => token.id);
}

/**
 * Whether a key event comes from a field where Space types text.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * Token size after scaling by a factor, rounded and kept inside the allowed range.
 */
export function scaleTokenSize(size: number, factor: number): number {
  return Math.min(Math.max(Math.round(size * factor), ARENA_TOKEN_SIZE_MIN), ARENA_TOKEN_SIZE_MAX);
}
