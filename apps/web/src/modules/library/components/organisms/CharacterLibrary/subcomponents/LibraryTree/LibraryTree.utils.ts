import {
  closestCenter,
  KeyboardCode,
  pointerWithin,
  type Active,
  type ClientRect,
  type CollisionDetection,
  type KeyboardCoordinateGetter,
  type Over,
} from "@dnd-kit/core";
import { isSameOrDescendant } from "@magista/shared";

import type { ILibraryData } from "@/modules/library/library.types";
import { ROOT_DROP_KIND } from "@/modules/library/library.constants";
import { dropPositionFor, fromDragId, toDragId } from "@/modules/library/library.utils";

import type { IDropTarget } from "./LibraryTree.types";

/**
 * Drag ids that cannot receive the dragged item: itself and, for folders, everything inside it.
 */
export function excludedDropIds(data: ILibraryData, activeDragId: string): string[] {
  const { kind, id } = fromDragId(activeDragId);
  if (kind !== "folder") return [activeDragId];
  const folders = data.folders
    .filter((folder) => isSameOrDescendant(data.folders, folder.id, id))
    .map((folder) => folder.id);
  return [
    ...folders.map((folderId) => toDragId({ kind: "folder", id: folderId })),
    ...data.characters
      .filter((character) => character.folderId !== null && folders.includes(character.folderId))
      .map((character) => toDragId({ kind: "character", id: character.id })),
  ];
}

/**
 * Pointer drags use the row under the pointer; keyboard drags the row closest to the moved item.
 * Rows that cannot receive the item are ignored.
 */
export function treeCollision(excluded: string[]): CollisionDetection {
  return (args) => {
    const droppableContainers = args.droppableContainers.filter(
      (container) => !excluded.includes(String(container.id)),
    );
    if (args.pointerCoordinates) return pointerWithin({ ...args, droppableContainers });
    return closestCenter({ ...args, droppableContainers });
  };
}

function referenceY(active: Active, activatorEvent: Event, deltaY: number, keyboard: boolean) {
  if (keyboard) {
    const rect = active.rect.current.translated;
    return rect ? rect.top + rect.height / 2 : null;
  }
  return "clientY" in activatorEvent ? (activatorEvent as MouseEvent).clientY + deltaY : null;
}

/**
 * The row and position (before, after or inside) where the dragged item would land right now.
 */
export function dropTargetOf(event: {
  active: Active;
  over: Over | null;
  activatorEvent: Event;
  delta: { x: number; y: number };
  keyboard: boolean;
}): IDropTarget | null {
  const { active, over } = event;
  if (!over) return null;
  const y = referenceY(active, event.activatorEvent, event.delta.y, event.keyboard);
  if (y === null) return null;
  const ratio = over.rect.height > 0 ? (y - over.rect.top) / over.rect.height : 0.5;
  const position = dropPositionFor(fromDragId(active.id).kind, fromDragId(over.id).kind, ratio);
  return position ? { dragId: String(over.id), position } : null;
}

/**
 * Swallows the click the browser fires right after a pointer drop, so releasing a row over its own
 * link does not open the sheet. Gives up after `timeoutMs` when no click comes.
 */
export function blockNextClick(timeoutMs: number): void {
  const block = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  window.addEventListener("click", block, { capture: true, once: true });
  window.setTimeout(() => window.removeEventListener("click", block, { capture: true }), timeoutMs);
}

/**
 * Vertical stops (viewport y) the keyboard can move the dragged item through: before, inside and after
 * each row it may land on, in the same proportions used by `dropPositionFor`.
 */
export function keyboardSlots(
  activeKind: string,
  rows: { kind: string; rect: Pick<ClientRect, "top" | "height"> }[],
): number[] {
  const slots = rows.flatMap(({ kind, rect }) => {
    const at = (ratio: number) => rect.top + rect.height * ratio;
    if (kind === ROOT_DROP_KIND) return [at(0.5)];
    if (kind === "folder")
      return activeKind === "folder" ? [at(0.12), at(0.5), at(0.88)] : [at(0.5)];
    if (kind === "character" && activeKind === "character") return [at(0.25), at(0.75)];
    return [];
  });
  return [...new Set(slots)].sort((a, b) => a - b);
}

/**
 * The next stop above or below `center`, or null at the ends.
 */
export function nextSlot(slots: number[], center: number, direction: "up" | "down"): number | null {
  if (direction === "down") return slots.find((slot) => slot > center + 1) ?? null;
  return [...slots].reverse().find((slot) => slot < center - 1) ?? null;
}

/**
 * Keyboard movement for the tree: up and down arrows jump between the valid drop positions instead
 * of fixed pixel steps. Rows that cannot receive the item have their drop target disabled.
 */
export const treeKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  { context, currentCoordinates },
) => {
  const direction =
    event.code === KeyboardCode.Down ? "down" : event.code === KeyboardCode.Up ? "up" : null;
  const { active, collisionRect, droppableRects, droppableContainers } = context;
  if (!direction || !active || !collisionRect) return undefined;
  event.preventDefault();
  const rows = droppableContainers.getEnabled().flatMap((container) => {
    const rect = droppableRects.get(container.id);
    return rect ? [{ kind: fromDragId(container.id).kind, rect }] : [];
  });
  const center = collisionRect.top + collisionRect.height / 2;
  const target = nextSlot(keyboardSlots(fromDragId(active.id).kind, rows), center, direction);
  if (target === null) return currentCoordinates;
  return { x: currentCoordinates.x, y: currentCoordinates.y + (target - center) };
};
