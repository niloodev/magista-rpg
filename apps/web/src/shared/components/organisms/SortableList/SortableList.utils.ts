/**
 * Indexes of a reorder (from, to) when `activeId` is dropped over `overId`, or null when nothing moves.
 */
export function reorderIndexes(
  ids: string[],
  activeId: string,
  overId: string | null,
): [number, number] | null {
  if (!overId || activeId === overId) return null;
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  return from < 0 || to < 0 ? null : [from, to];
}

/**
 * Returns a copy of the list with the item at `from` moved to `to`.
 */
export function moveListItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return next;
  next.splice(Math.max(0, Math.min(to, next.length)), 0, moved);
  return next;
}

/**
 * Moves the item `activeId` to the place of `overId`, looking both up in the list as it is now
 * (so a list changed by someone else during the drag still moves the right item). Unknown ids keep
 * the list as is.
 */
export function moveListItemById<T extends { id: string }>(
  list: readonly T[],
  activeId: string,
  overId: string,
): T[] {
  const indexes = reorderIndexes(
    list.map((item) => item.id),
    activeId,
    overId,
  );
  return indexes ? moveListItem(list, indexes[0], indexes[1]) : [...list];
}
