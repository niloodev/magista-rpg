"use client";

import { isErrorResult, type IArenaPoint } from "@magista/shared";
import { useCallback, useMemo, useState } from "react";

import { ARENA_TOKEN_MENU_TEXTS } from "@/modules/arena/arena.constants";
import { pastePlacements, tokenDisplayName } from "@/modules/arena/arena.utils";
import type { IArenaTokenMenuItem } from "@/modules/arena/components/molecules";
import { copyArenaTokens } from "@/modules/arena/services";
import { useApp, useAppStoreApi } from "@/modules/shell/store";
import { useStableCallback } from "@/shared/hooks";

import type {
  IArenaTokenActions,
  IArenaTokenMenuState,
  UseArenaTokenActionsProps,
} from "./useArenaTokenActions.types";

/**
 * The right-click menu of the tokens and the GM's copy and paste. A right click outside the selection selects
 * the clicked token first, so every action works on the selection; on the empty map the menu only pastes.
 */
export function useArenaTokenActions({
  isGm,
  sceneId,
  selectedTokens,
  selectedTokenIds,
  controlsRef,
  boundsRef,
  allHidden,
  canOpenSheet,
  canRemove,
  onApplyChange,
  onConfigure,
  onToggleHidden,
  onOpenSheet,
  onRemove,
  onAnnounce,
  onError,
}: UseArenaTokenActionsProps): IArenaTokenActions {
  const store = useAppStoreApi();
  const clipboardSize = useApp((state) => state.arena.tokenClipboard.length);
  const [menuState, setMenuState] = useState<IArenaTokenMenuState | null>(null);

  const copySelection = useStableCallback(() => {
    if (!isGm || selectedTokens.length === 0) return false;
    store.getState().copyArenaTokens(selectedTokens);
    onAnnounce(ARENA_TOKEN_MENU_TEXTS.copied(selectedTokens.length));
    return true;
  });

  const paste = useStableCallback((at: IArenaPoint | null = null) => {
    const copied = store.getState().arena.tokenClipboard;
    if (!isGm || !sceneId || copied.length === 0) return false;
    const anchor = at ?? controlsRef.current?.pointerWorld() ?? null;
    const tokens = pastePlacements(copied, anchor, boundsRef.current);
    void copyArenaTokens(sceneId, { tokens }).then((result) => {
      if (isErrorResult(result)) {
        onError(result.error);
        return;
      }
      onError(null);
      const pasted = result.payload.map((change) => change.token);
      store.getState().applyArenaTokens(pasted);
      if (store.getState().arena.view?.scene?.id === sceneId)
        store.getState().selectArenaTokens(
          pasted.map((token) => token.id),
          "replace",
        );
      onAnnounce(ARENA_TOKEN_MENU_TEXTS.pasted(pasted.length));
    });
    return true;
  });

  const openMenu = useStableCallback((tokenId: string | null, client: IArenaPoint) => {
    if (tokenId && !selectedTokenIds.includes(tokenId))
      store.getState().selectArenaTokens([tokenId], "replace");
    if (!tokenId && !(isGm && clipboardSize > 0)) return;
    setMenuState({
      anchor: client,
      world: controlsRef.current?.clientToWorld(client.x, client.y) ?? null,
      onToken: tokenId !== null,
    });
  });

  const closeMenu = useCallback(() => setMenuState(null), []);

  const menu = useMemo(() => {
    if (!menuState) return null;
    const { anchor, world, onToken } = menuState;
    const items: IArenaTokenMenuItem[] = [];
    const tokens = onToken ? selectedTokens : [];
    if (tokens.length > 0) {
      items.push({
        id: "apply",
        label: ARENA_TOKEN_MENU_TEXTS.apply,
        icon: "swords",
        onSelect: () => onApplyChange(anchor),
      });
      if (isGm && tokens.length === 1)
        items.push({
          id: "configure",
          label: ARENA_TOKEN_MENU_TEXTS.configure,
          icon: "settings",
          onSelect: onConfigure,
        });
      if (canOpenSheet)
        items.push({
          id: "sheet",
          label: ARENA_TOKEN_MENU_TEXTS.openSheet,
          icon: "scroll-text",
          onSelect: onOpenSheet,
        });
      if (isGm) {
        items.push(
          {
            id: "hidden",
            label: allHidden ? ARENA_TOKEN_MENU_TEXTS.show : ARENA_TOKEN_MENU_TEXTS.hide,
            icon: allHidden ? "eye" : "eye-off",
            onSelect: onToggleHidden,
          },
          {
            id: "copy",
            label: ARENA_TOKEN_MENU_TEXTS.copy,
            icon: "copy",
            separated: true,
            onSelect: () => void copySelection(),
          },
        );
      }
    }
    if (isGm && clipboardSize > 0)
      items.push({
        id: "paste",
        label: ARENA_TOKEN_MENU_TEXTS.paste,
        icon: "clipboard-paste",
        separated: items.length > 0 && items.at(-1)?.id !== "copy",
        onSelect: () => void paste(world),
      });
    if (canRemove && tokens.length > 0)
      items.push({
        id: "remove",
        label: ARENA_TOKEN_MENU_TEXTS.remove,
        icon: "trash-2",
        destructive: true,
        separated: true,
        onSelect: onRemove,
      });
    if (items.length === 0) return null;
    const first = tokens[0];
    const label = first
      ? ARENA_TOKEN_MENU_TEXTS.label(
          tokens.length === 1
            ? tokenDisplayName(first, isGm)
            : ARENA_TOKEN_MENU_TEXTS.selectionCount(tokens.length),
        )
      : ARENA_TOKEN_MENU_TEXTS.mapLabel;
    return { label, anchor, items };
  }, [
    menuState,
    selectedTokens,
    isGm,
    canOpenSheet,
    canRemove,
    allHidden,
    clipboardSize,
    onApplyChange,
    onConfigure,
    onOpenSheet,
    onToggleHidden,
    onRemove,
    copySelection,
    paste,
  ]);

  return { menu, openMenu, closeMenu, copySelection, paste };
}
