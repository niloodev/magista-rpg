"use client";

import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { childFolders } from "@magista/shared";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  AUTO_EXPAND_DELAY_MS,
  ROOT_DROP_ID,
  ROOT_DROP_KIND,
} from "@/modules/library/library.constants";
import type { ITreeLeaf } from "@/modules/library/library.types";
import { fromDragId, leavesIn, moveForTreeDrop, toDragId } from "@/modules/library/library.utils";
import { useDocumentBody, usePrefersReducedMotion } from "@/shared/hooks";

import {
  IDLE_TREE_DRAG,
  POINTER_ACTIVATION_DISTANCE,
  POSITION_LABELS,
  POST_DROP_CLICK_GUARD_MS,
  TREE_INSTRUCTIONS,
} from "./FolderTree.constants";
import type {
  FolderTreeProps,
  IDropTarget,
  ITreeDragState,
  ITreeFolderView,
  ITreeLeafView,
  ITreePreview,
} from "./FolderTree.types";
import {
  blockNextClick,
  dropTargetOf,
  excludedDropIds,
  releasePoint,
  treeCollision,
  treeKeyboardCoordinates,
} from "./FolderTree.utils";

/**
 * A folder tree with drag and drop for any kind of leaf (characters, scenes): drop on the middle of a folder
 * to put the item inside, on the edges of a row to place it before or after, or on the root zone to take it
 * out of every folder. Holding an item over a closed folder opens it. A leaf released outside every row is
 * handed to `onDropOutside` (to place it somewhere else, like the Arena map).
 */
export function useFolderTree<L extends ITreeLeaf>({
  folders: folderList,
  leaves,
  leafKind,
  expandedFolderIds,
  onToggleFolder,
  onExpandFolders,
  onMove,
  folderSummary,
  folderMenu,
  renderLeaf,
  leafPortrait,
  labels,
  onDropOutside,
}: FolderTreeProps<L>) {
  const [drag, setDrag] = useState<ITreeDragState>(IDLE_TREE_DRAG);
  const targetRef = useRef<IDropTarget | null>(null);
  const expandTimer = useRef<{ dragId: string; timer: number } | null>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const trackPointer = useRef((event: PointerEvent) => {
    lastPointer.current = { x: event.clientX, y: event.clientY };
  });
  const reducedMotion = usePrefersReducedMotion();
  const overlayRoot = useDocumentBody();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE } }),
    useSensor(KeyboardSensor, { coordinateGetter: treeKeyboardCoordinates }),
  );
  const tree = useMemo(() => ({ folders: folderList, leaves }), [folderList, leaves]);

  const clearExpandTimer = () => {
    if (expandTimer.current) window.clearTimeout(expandTimer.current.timer);
    expandTimer.current = null;
  };

  useEffect(() => clearExpandTimer, []);

  useEffect(() => {
    const listener = trackPointer.current;
    return () => window.removeEventListener("pointermove", listener);
  }, []);

  const folders = useMemo(() => {
    const leafView = (leaf: L): ITreeLeafView => ({
      id: leaf.id,
      dragId: toDragId({ kind: leafKind, id: leaf.id }),
      name: leaf.name,
      render: (slots) => renderLeaf(leaf, slots),
    });
    const build = (parentId: string | null): ITreeFolderView[] =>
      childFolders(folderList, parentId).map((folder) => {
        const children = build(folder.id);
        const contents = leavesIn(leaves, folder.id).map(leafView);
        return {
          id: folder.id,
          dragId: toDragId({ kind: "folder", id: folder.id }),
          name: folder.name,
          summary: folderSummary(folder.id),
          expanded: expandedFolderIds.includes(folder.id),
          groupId: `tree-folder-${folder.id}`,
          menu: folderMenu(folder),
          onToggle: () => onToggleFolder(folder.id),
          empty: children.length === 0 && contents.length === 0,
          folders: children,
          leaves: contents,
        };
      });
    return { root: build(null), rootLeaves: leavesIn(leaves, null).map(leafView) };
  }, [
    folderList,
    leaves,
    leafKind,
    expandedFolderIds,
    folderSummary,
    folderMenu,
    onToggleFolder,
    renderLeaf,
  ]);

  const nameOf = (dragId: string | number) => {
    const { kind, id } = fromDragId(dragId);
    if (kind === ROOT_DROP_KIND) return labels.rootIdle;
    if (kind === "folder") return folderList.find((folder) => folder.id === id)?.name ?? "";
    return leaves.find((leaf) => leaf.id === id)?.name ?? "";
  };

  const describe = (activeId: string | number, target: IDropTarget | null) =>
    target
      ? `${nameOf(activeId)} ${POSITION_LABELS[target.position]} ${nameOf(target.dragId)}.`
      : `${nameOf(activeId)} fora de um lugar válido.`;

  const scheduleExpand = (target: IDropTarget | null) => {
    const folderId =
      target?.position === "inside" && fromDragId(target.dragId).kind === "folder"
        ? fromDragId(target.dragId).id
        : null;
    if (!folderId || expandedFolderIds.includes(folderId)) {
      clearExpandTimer();
      return;
    }
    if (expandTimer.current?.dragId === target?.dragId) return;
    clearExpandTimer();
    expandTimer.current = {
      dragId: target?.dragId ?? "",
      timer: window.setTimeout(() => onExpandFolders([folderId]), AUTO_EXPAND_DELAY_MS),
    };
  };

  const stopTrackingPointer = () => {
    window.removeEventListener("pointermove", trackPointer.current);
    lastPointer.current = null;
  };

  const onDragStart = ({ active, activatorEvent }: DragStartEvent) => {
    targetRef.current = null;
    stopTrackingPointer();
    if (onDropOutside && !(activatorEvent instanceof KeyboardEvent))
      window.addEventListener("pointermove", trackPointer.current);
    setDrag({
      activeId: String(active.id),
      keyboard: activatorEvent instanceof KeyboardEvent,
      excluded: excludedDropIds(tree, leafKind, String(active.id)),
      target: null,
    });
  };

  const onDragMove = (event: DragMoveEvent) => {
    const target = dropTargetOf({ ...event, keyboard: drag.keyboard });
    targetRef.current = target;
    scheduleExpand(target);
    if (target?.dragId !== drag.target?.dragId || target?.position !== drag.target?.position)
      setDrag((current) => ({ ...current, target }));
  };

  const finish = () => {
    clearExpandTimer();
    stopTrackingPointer();
    setDrag(IDLE_TREE_DRAG);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const target = dropTargetOf({ ...event, keyboard: drag.keyboard });
    const keyboard = drag.keyboard;
    if (!keyboard) blockNextClick(POST_DROP_CLICK_GUARD_MS);
    const pointer = lastPointer.current;
    finish();
    const active = fromDragId(event.active.id);
    if (!target) {
      const point = keyboard ? null : (pointer ?? releasePoint(event.activatorEvent, event.delta));
      const leaf = active.kind === leafKind ? leaves.find((item) => item.id === active.id) : null;
      if (point && leaf && !event.over) onDropOutside?.(leaf, point);
      return;
    }
    if (active.kind !== "folder" && active.kind !== leafKind) return;
    const move = moveForTreeDrop(tree, active, fromDragId(target.dragId), target.position);
    if (!move) return;
    if (move.parentId) onExpandFolders([move.parentId]);
    void onMove(move);
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Pegou ${nameOf(active.id)}.`,
    onDragOver: ({ active }) => describe(active.id, targetRef.current),
    onDragMove: ({ active }) => describe(active.id, targetRef.current),
    onDragEnd: ({ active }) =>
      targetRef.current
        ? `Soltou ${describe(active.id, targetRef.current)}`
        : `${nameOf(active.id)} solto.`,
    onDragCancel: ({ active }) => `Movimento de ${nameOf(active.id)} cancelado.`,
  };

  const preview = useMemo((): ITreePreview | null => {
    if (!drag.activeId) return null;
    const { kind, id } = fromDragId(drag.activeId);
    if (kind === "folder") {
      const folder = folderList.find((item) => item.id === id);
      return folder ? { kind: "folder", name: folder.name, portraitUrl: null } : null;
    }
    const leaf = leaves.find((item) => item.id === id);
    return leaf ? { kind: "leaf", name: leaf.name, portraitUrl: leafPortrait(leaf) } : null;
  }, [drag.activeId, folderList, leaves, leafPortrait]);

  return {
    folders: folders.root,
    leaves: folders.rootLeaves,
    isEmpty: folders.root.length === 0 && folders.rootLeaves.length === 0,
    dragging: drag.activeId !== null,
    target: drag.target,
    excluded: drag.excluded,
    rootDropId: ROOT_DROP_ID,
    rootDropActive: drag.target?.dragId === ROOT_DROP_ID,
    preview,
    overlayRoot,
    sensors,
    collision: treeCollision(drag.excluded),
    reducedMotion,
    accessibility: { announcements, screenReaderInstructions: { draggable: TREE_INSTRUCTIONS } },
    onDragStart,
    onDragMove,
    onDragEnd,
    onDragCancel: finish,
  };
}
