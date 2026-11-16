"use client";

import {
  isErrorResult,
  matchesSearch,
  type ICharacterSummary,
  type IFolder,
  type IMoveLibraryItemInput,
} from "@magista/shared";
import {
  createElement,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLibraryShapeHint } from "@/modules/library/hooks";
import {
  EXPANDED_STORAGE_KEY,
  LIBRARY_SHAPE_HINT_KEY,
  SEARCH_SHORTCUT,
} from "@/modules/library/library.constants";
import type { ITreeMove, LibraryDialog } from "@/modules/library/library.types";
import { characterSubtitle, libraryShape, searchCharacters } from "@/modules/library/library.utils";
import { portraitOf } from "@/modules/sheet/sheet.utils";
import { toMediaUrl } from "@/core/services/http";
import { fetchLibrary, moveLibraryItem } from "@/modules/library/services";
import { useSkeletonHintActions } from "@/modules/shell/providers";
import { useApp, useAppStoreApi } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";

import { NOTICE_CLASSES, NOTICE_TIMEOUT_MS } from "./CharacterLibrary.constants";
import {
  accessLabels,
  characterCountLabel,
  characterMenu,
  playerCharacterMenu,
  folderMenu,
  isTypingTarget,
} from "./CharacterLibrary.utils";
import type { CharacterLibraryProps } from "./CharacterLibrary.types";
import { CharacterTreeLeaf, type ICharacterRowItem } from "./subcomponents";
import type { ITreeLeafSlots } from "../FolderTree";

/**
 * Loads the character library (and reloads it when the server says it changed), owns search,
 * dialogs, notices and the optimistic move used by drag and drop.
 */
export function useCharacterLibrary({
  onPlaceCharacter,
  onOpenCharacter,
}: Pick<CharacterLibraryProps, "onPlaceCharacter" | "onOpenCharacter">) {
  const store = useAppStoreApi();
  const socket = useTableSocket();
  const role = useApp((state) => state.session.data?.account.role);
  const library = useApp((state) => state.library);
  const setQuery = useApp((state) => state.setLibraryQuery);
  const toggleFolder = useApp((state) => state.toggleLibraryFolder);
  const expandFolders = useApp((state) => state.expandLibraryFolders);
  const [dialog, setDialog] = useState<LibraryDialog | null>(null);
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);
  const latestRequest = useRef(0);
  const isGm = role === "GM";

  const reload = useCallback(async () => {
    if (!role) return;
    latestRequest.current += 1;
    const request = latestRequest.current;
    store.getState().startLibraryLoad();
    const result = await fetchLibrary(role === "GM");
    if (request !== latestRequest.current) return;
    if (isErrorResult(result)) store.getState().failLibraryLoad(result.error);
    else store.getState().finishLibraryLoad(result.payload);
  }, [role, store]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!socket) return;
    const onChanged = () => void reload();
    let connectedBefore = socket.connected;
    const onConnect = () => {
      if (connectedBefore) void reload();
      connectedBefore = true;
    };
    socket.on("library:changed", onChanged);
    socket.on("connect", onConnect);
    return () => {
      socket.off("library:changed", onChanged);
      socket.off("connect", onConnect);
    };
  }, [socket, reload]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== SEARCH_SHORTCUT || isTypingTarget(event.target)) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), NOTICE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(EXPANDED_STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved))
        store.getState().setExpandedLibraryFolders(saved.filter((id) => typeof id === "string"));
    } catch {
      store.getState().setExpandedLibraryFolders([]);
    }
  }, [store]);

  useEffect(() => {
    if (library.status !== "ready") return;
    try {
      window.localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(library.expandedFolderIds));
    } catch {
      return;
    }
  }, [library.expandedFolderIds, library.status]);

  const moveItem = useCallback(
    async (move: IMoveLibraryItemInput) => {
      const snapshot = store.getState().applyLibraryMove(move);
      const result = await moveLibraryItem(move);
      if (isErrorResult(result)) {
        store.getState().restoreLibraryData(snapshot);
        setNotice(result.error);
        await reload();
      }
    },
    [store, reload],
  );

  const onTreeMove = useCallback(
    (move: ITreeMove) => {
      if (move.kind === "folder" || move.kind === "character")
        void moveItem({ ...move, kind: move.kind });
    },
    [moveItem],
  );

  const query = useDeferredValue(library.query);
  const searching = query.trim().length > 0;
  const data = useMemo(
    () => ({ characters: library.characters, folders: library.folders }),
    [library.characters, library.folders],
  );
  const shapeHint = useLibraryShapeHint();
  const { setHint } = useSkeletonHintActions();

  const results = useMemo(
    () => (searching ? searchCharacters(data, query) : []),
    [searching, data, query],
  );
  const playerCharacters = useMemo(
    () =>
      library.characters
        .filter((character) => matchesSearch(character.name, query))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [library.characters, query],
  );
  const folderMenuOf = useCallback((folder: IFolder) => folderMenu(folder, setDialog), []);
  const portraitUrlOf = useCallback(
    (character: ICharacterSummary) => toMediaUrl(portraitOf(character)),
    [],
  );

  const accountLogins = useMemo(
    () => new Map(library.accounts.map((account) => [account.id, account.login])),
    [library.accounts],
  );

  useEffect(() => {
    if (library.status !== "ready") return;
    setHint(
      LIBRARY_SHAPE_HINT_KEY,
      libraryShape(data, library.expandedFolderIds, accountLogins, isGm),
    );
  }, [data, library.expandedFolderIds, library.status, accountLogins, isGm, setHint]);

  const gridItems = useMemo<ICharacterRowItem[]>(() => {
    const toItem = (character: ICharacterSummary, path?: string): ICharacterRowItem => ({
      id: character.id,
      name: character.name,
      subtitle: characterSubtitle(character),
      href: `/ficha/${character.id}`,
      portraitUrl: toMediaUrl(portraitOf(character)),
      path,
      features: character.features,
      character,
      accountLabels: isGm ? accessLabels(character, accountLogins) : undefined,
      menu: isGm
        ? characterMenu(character, setDialog, onPlaceCharacter)
        : playerCharacterMenu(character, onPlaceCharacter),
    });
    if (!isGm) return playerCharacters.map((character) => toItem(character));
    return results.map(({ character, path }) => toItem(character, path));
  }, [isGm, playerCharacters, results, accountLogins, onPlaceCharacter]);

  const renderLeaf = useCallback(
    (character: ICharacterSummary, slots: ITreeLeafSlots) =>
      createElement(CharacterTreeLeaf, {
        character,
        slots,
        accountLogins,
        onDialog: setDialog,
        onOpen: onOpenCharacter,
        onPlace: onPlaceCharacter,
      }),
    [accountLogins, onOpenCharacter, onPlaceCharacter],
  );

  const loading = library.status === "idle" || library.status === "loading";
  const visibleCount = isGm ? (searching ? results.length : null) : playerCharacters.length;

  return {
    isGm,
    status: library.status,
    loading,
    shapeHint,
    totalSample: characterCountLabel(
      Math.max(isGm ? shapeHint.tree.length : shapeHint.list.length, 1),
    ),
    error: library.error,
    query: library.query,
    setQuery,
    searchRef,
    searching,
    gridItems,
    data,
    expandedFolderIds: library.expandedFolderIds,
    toggleFolder,
    expandFolders,
    accountLogins,
    resultLabel: loading || visibleCount === null ? "" : characterCountLabel(visibleCount),
    totalLabel: loading ? null : characterCountLabel(library.characters.length),
    dialog,
    openDialog: setDialog,
    newFolder: () => setDialog({ type: "createFolder", parentId: null }),
    newCharacter: () => setDialog({ type: "createCharacter", folderId: null }),
    manageAccounts: () => setDialog({ type: "accounts" }),
    closeDialog: () => setDialog(null),
    reload,
    notice,
    noticeClassName: NOTICE_CLASSES[notice ? "visible" : "hidden"],
    setNotice,
    moveItem,
    onTreeMove,
    folderMenuOf,
    renderLeaf,
    portraitUrlOf,
  };
}
