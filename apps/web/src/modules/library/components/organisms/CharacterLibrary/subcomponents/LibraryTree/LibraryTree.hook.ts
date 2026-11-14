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
import { childFolders, type ICharacterSummary } from "@magista/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toMediaUrl } from "@/core/services/http";
import {
  AUTO_EXPAND_DELAY_MS,
  ROOT_DROP_ID,
  ROOT_DROP_KIND,
  ROOT_FOLDER_LABEL,
} from "@/modules/library/library.constants";
import {
  characterSubtitle,
  charactersIn,
  countCharactersDeep,
  folderSummary,
  fromDragId,
  moveForDrop,
  toDragId,
} from "@/modules/library/library.utils";
import { portraitOf } from "@/modules/sheet/sheet.utils";
import { useDocumentBody, usePrefersReducedMotion } from "@/shared/hooks";

import { accessLabels, characterMenu, folderMenu } from "../../CharacterLibrary.utils";
import {
  IDLE_TREE_DRAG,
  POINTER_ACTIVATION_DISTANCE,
  POSITION_LABELS,
  POST_DROP_CLICK_GUARD_MS,
  TREE_INSTRUCTIONS,
} from "./LibraryTree.constants";
import type {
  IDropTarget,
  ITreeCharacterView,
  ITreeDragState,
  ITreeFolderView,
  LibraryTreeProps,
} from "./LibraryTree.types";
import {
  blockNextClick,
  dropTargetOf,
  excludedDropIds,
  treeCollision,
  treeKeyboardCoordinates,
} from "./LibraryTree.utils";

/**
 * GM library as an expandable tree with drag and drop: drop on the middle of a folder to put the item
 * inside, on the edges of a row to place it before or after, or on the root zone to take it out of
 * every folder. Holding an item over a closed folder opens it.
 */
export function useLibraryTree({
  data,
  expandedFolderIds,
  accountLogins,
  onToggleFolder,
  onExpandFolders,
  onMove,
  onDialog,
}: LibraryTreeProps) {
  const [drag, setDrag] = useState<ITreeDragState>(IDLE_TREE_DRAG);
  const targetRef = useRef<IDropTarget | null>(null);
  const expandTimer = useRef<{ dragId: string; timer: number } | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const overlayRoot = useDocumentBody();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: treeKeyboardCoordinates,
    }),
  );

  const clearExpandTimer = () => {
    if (expandTimer.current) window.clearTimeout(expandTimer.current.timer);
    expandTimer.current = null;
  };

  useEffect(() => clearExpandTimer, []);

  const characterView = useCallback(
    (character: ICharacterSummary): ITreeCharacterView => ({
      id: character.id,
      dragId: toDragId({ kind: "character", id: character.id }),
      name: character.name,
      subtitle: characterSubtitle(character),
      href: `/ficha/${character.id}`,
      portraitUrl: toMediaUrl(portraitOf(character)),
      accountLabels: accessLabels(character, accountLogins),
      menu: characterMenu(character, onDialog),
    }),
    [accountLogins, onDialog],
  );

  const folders = useMemo(() => {
    const build = (parentId: string | null): ITreeFolderView[] =>
      childFolders(data.folders, parentId).map((folder) => {
        const subfolders = childFolders(data.folders, folder.id).length;
        const folders = build(folder.id);
        const characters = charactersIn(data.characters, folder.id).map(characterView);
        return {
          id: folder.id,
          dragId: toDragId({ kind: "folder", id: folder.id }),
          name: folder.name,
          summary: folderSummary(countCharactersDeep(data, folder.id), subfolders),
          expanded: expandedFolderIds.includes(folder.id),
          groupId: `library-folder-${folder.id}`,
          menu: folderMenu(folder, onDialog),
          onToggle: () => onToggleFolder(folder.id),
          empty: folders.length === 0 && characters.length === 0,
          folders,
          characters,
        };
      });
    return build(null);
  }, [data, expandedFolderIds, onDialog, onToggleFolder, characterView]);
  const characters = useMemo(
    () => charactersIn(data.characters, null).map(characterView),
    [data.characters, characterView],
  );

  const nameOf = (dragId: string | number) => {
    const { kind, id } = fromDragId(dragId);
    if (kind === ROOT_DROP_KIND) return ROOT_FOLDER_LABEL;
    if (kind === "folder") return data.folders.find((folder) => folder.id === id)?.name ?? "";
    return data.characters.find((character) => character.id === id)?.name ?? "";
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

  const onDragStart = ({ active, activatorEvent }: DragStartEvent) => {
    const excluded = excludedDropIds(data, String(active.id));
    targetRef.current = null;
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
    if (target?.dragId !== drag.target?.dragId || target?.position !== drag.target?.position)
      setDrag((current) => ({ ...current, target }));
  };

  const finish = () => {
    clearExpandTimer();
    setDrag(IDLE_TREE_DRAG);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const target = dropTargetOf({ ...event, keyboard: drag.keyboard });
    if (!drag.keyboard) blockNextClick(POST_DROP_CLICK_GUARD_MS);
    finish();
    const active = fromDragId(event.active.id);
    if (!target || (active.kind !== "folder" && active.kind !== "character")) return;
    const move = moveForDrop(
      data,
      { kind: active.kind, id: active.id },
      fromDragId(target.dragId),
      target.position,
    );
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

  const preview = useMemo(() => {
    if (!drag.activeId) return null;
    const { kind, id } = fromDragId(drag.activeId);
    if (kind === "folder") {
      const folder = data.folders.find((item) => item.id === id);
      return folder ? { kind: "folder" as const, name: folder.name, portraitUrl: null } : null;
    }
    const character = data.characters.find((item) => item.id === id);
    return character
      ? {
          kind: "character" as const,
          name: character.name,
          portraitUrl: toMediaUrl(portraitOf(character)),
        }
      : null;
  }, [drag.activeId, data]);

  return {
    folders,
    characters,
    isEmpty: folders.length === 0 && characters.length === 0,
    dragging: drag.activeId !== null,
    activeId: drag.activeId,
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
    newFolder: () => onDialog({ type: "createFolder", parentId: null }),
    newCharacter: () => onDialog({ type: "createCharacter", folderId: null }),
  };
}
