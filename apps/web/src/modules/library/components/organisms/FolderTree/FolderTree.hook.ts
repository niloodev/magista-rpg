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
import { useEffect, useMemo, useRef, useState } from "react";

import {
  AUTO_EXPAND_DELAY_MS,
  ROOT_DROP_ID,
  ROOT_DROP_KIND,
} from "@/modules/library/library.constants";
import type { ITreeLeaf } from "@/modules/library/library.types";
import {
  buildTreeIndex,
  fromDragId,
  moveForTreeDrop,
  toDragId,
} from "@/modules/library/library.utils";
import { useDocumentBody, usePrefersReducedMotion } from "@/shared/hooks";

import {
  IDLE_TREE_DRAG,
  KEYBOARD_SENSOR_OPTIONS,
  POINTER_SENSOR_OPTIONS,
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
  ITreeRowsContext,
} from "./FolderTree.types";
import {
  blockNextClick,
  createTreeRowStore,
  dropTargetOf,
  excludedDropIds,
  releasePoint,
  treeCollision,
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
  outsidePreview,
}: FolderTreeProps<L>) {
  const [drag, setDrag] = useState<ITreeDragState>(IDLE_TREE_DRAG);
  const targetRef = useRef<IDropTarget | null>(null);
  const expandTimer = useRef<{ dragId: string; timer: number } | null>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const [outsideStart, setOutsideStart] = useState<{ x: number; y: number } | null>(null);
  const outsideRef = useRef(outsidePreview);
  const outsideOver = useRef(false);
  const outsideNode = useRef<HTMLDivElement | null>(null);
  const trackPointer = useRef((event: PointerEvent) => {
    const point = { x: event.clientX, y: event.clientY };
    lastPointer.current = point;
    const over = outsideRef.current?.isOver(point) ?? false;
    if (over !== outsideOver.current) {
      outsideOver.current = over;
      setOutsideStart(over ? point : null);
      return;
    }
    const node = outsideNode.current;
    if (over && node) {
      node.style.left = `${point.x}px`;
      node.style.top = `${point.y}px`;
    }
  });

  useEffect(() => {
    outsideRef.current = outsidePreview;
  });
  const reducedMotion = usePrefersReducedMotion();
  const overlayRoot = useDocumentBody();
  const sensors = useSensors(
    useSensor(PointerSensor, POINTER_SENSOR_OPTIONS),
    useSensor(KeyboardSensor, KEYBOARD_SENSOR_OPTIONS),
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
    const index = buildTreeIndex(tree);
    const expanded = new Set(expandedFolderIds);
    const leafView = (leaf: L): ITreeLeafView => ({
      id: leaf.id,
      dragId: toDragId({ kind: leafKind, id: leaf.id }),
      name: leaf.name,
      leaf,
    });
    const build = (parentId: string | null): ITreeFolderView[] =>
      index.folders(parentId).map((folder) => {
        const open = expanded.has(folder.id);
        const childCount = index.folders(folder.id).length;
        return {
          id: folder.id,
          dragId: toDragId({ kind: "folder", id: folder.id }),
          name: folder.name,
          summary: folderSummary(index.deepCount(folder.id), childCount),
          expanded: open,
          groupId: `tree-folder-${folder.id}`,
          menu: folderMenu(folder),
          empty: childCount === 0 && index.leaves(folder.id).length === 0,
          folders: open ? build(folder.id) : [],
          leaves: open ? index.leaves(folder.id).map(leafView) : [],
        };
      });
    return { root: build(null), rootLeaves: index.leaves(null).map(leafView) };
  }, [tree, leafKind, expandedFolderIds, folderSummary, folderMenu]);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const folder of folderList)
      map.set(toDragId({ kind: "folder", id: folder.id }), folder.name);
    for (const leaf of leaves) map.set(toDragId({ kind: leafKind, id: leaf.id }), leaf.name);
    return map;
  }, [folderList, leaves, leafKind]);

  const [rowStore] = useState(createTreeRowStore);
  const excludedRef = useRef(IDLE_TREE_DRAG.excluded);
  const rowsContext = useMemo<ITreeRowsContext>(
    () => ({
      rows: rowStore,
      labels,
      onToggleFolder,
      renderLeaf: renderLeaf as ITreeRowsContext["renderLeaf"],
    }),
    [rowStore, labels, onToggleFolder, renderLeaf],
  );

  const nameOf = (dragId: string | number) => {
    if (fromDragId(dragId).kind === ROOT_DROP_KIND) return labels.rootIdle;
    return names.get(String(dragId)) ?? "";
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
    outsideOver.current = false;
    setOutsideStart(null);
  };

  const onDragStart = ({ active, activatorEvent }: DragStartEvent) => {
    targetRef.current = null;
    stopTrackingPointer();
    if (onDropOutside && !(activatorEvent instanceof KeyboardEvent))
      window.addEventListener("pointermove", trackPointer.current);
    const excluded = excludedDropIds(tree, leafKind, String(active.id));
    excludedRef.current = excluded;
    rowStore.set(null, excluded);
    setDrag({
      activeId: String(active.id),
      keyboard: activatorEvent instanceof KeyboardEvent,
      excluded,
      target: null,
    });
  };

  const onDragMove = (event: DragMoveEvent) => {
    const target = dropTargetOf({ ...event, keyboard: drag.keyboard });
    targetRef.current = target;
    scheduleExpand(target);
    rowStore.set(target, excludedRef.current);
    if (target?.dragId !== drag.target?.dragId || target?.position !== drag.target?.position)
      setDrag((current) => ({ ...current, target }));
  };

  const finish = () => {
    clearExpandTimer();
    stopTrackingPointer();
    excludedRef.current = IDLE_TREE_DRAG.excluded;
    rowStore.set(null, IDLE_TREE_DRAG.excluded);
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

  const collision = useMemo(() => treeCollision(drag.excluded), [drag.excluded]);
  const announcementsRef = useRef({ nameOf, describe });
  useEffect(() => {
    announcementsRef.current = { nameOf, describe };
  });
  const accessibility = useMemo(() => {
    const name = (id: string | number) => announcementsRef.current.nameOf(id);
    const say = (id: string | number) => announcementsRef.current.describe(id, targetRef.current);
    const announcements: Announcements = {
      onDragStart: ({ active }) => `Pegou ${name(active.id)}.`,
      onDragOver: ({ active }) => say(active.id),
      onDragMove: ({ active }) => say(active.id),
      onDragEnd: ({ active }) =>
        targetRef.current ? `Soltou ${say(active.id)}` : `${name(active.id)} solto.`,
      onDragCancel: ({ active }) => `Movimento de ${name(active.id)} cancelado.`,
    };
    return { announcements, screenReaderInstructions: { draggable: TREE_INSTRUCTIONS } };
  }, []);

  const outsideLeaf =
    outsideStart && outsidePreview && drag.activeId
      ? leaves.find((item) => toDragId({ kind: leafKind, id: item.id }) === drag.activeId)
      : undefined;

  return {
    outsideNode,
    outside:
      outsideLeaf && outsideStart && outsidePreview
        ? { point: outsideStart, node: outsidePreview.render(outsideLeaf) }
        : null,
    folders: folders.root,
    leaves: folders.rootLeaves,
    isEmpty: folders.root.length === 0 && folders.rootLeaves.length === 0,
    dragging: drag.activeId !== null,
    rootDropId: ROOT_DROP_ID,
    rootDropActive: drag.target?.dragId === ROOT_DROP_ID,
    preview,
    overlayRoot,
    sensors,
    collision,
    reducedMotion,
    accessibility,
    rowsContext,
    onDragStart,
    onDragMove,
    onDragEnd,
    onDragCancel: finish,
  };
}
