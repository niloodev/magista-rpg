"use client";

import {
  isErrorResult,
  type IArenaPoint,
  type ICharacterSummary,
  type ICreateArenaTokenInput,
} from "@magista/shared";
import { useCallback, useMemo, useState } from "react";

import { ARENA_PLACEMENT_TEXTS } from "@/modules/arena/arena.constants";
import { placementPoint } from "@/modules/arena/arena.utils";
import { createArenaToken, uploadArenaTokenImage } from "@/modules/arena/services";
import { useAppStoreApi } from "@/modules/shell/store";

import type {
  ArenaPlacementResult,
  IArenaTokenPlacement,
  UseArenaTokenPlacementProps,
} from "./useArenaTokenPlacement.types";

/**
 * GM token creation in the Arena: a sheet dropped on the map (at the drop point), "Colocar no mapa" and NPC
 * tokens (at the center of the view). The new token shows at once, selected, and the table gets it by event.
 */
export function useArenaTokenPlacement({
  sceneId,
  enabled,
  controlsRef,
  boundsRef,
  onError,
}: UseArenaTokenPlacementProps): IArenaTokenPlacement {
  const store = useAppStoreApi();
  const [npcDialogOpen, setNpcDialogOpen] = useState(false);

  const create = useCallback(
    async (
      input: Omit<ICreateArenaTokenInput, "x" | "y">,
      at: IArenaPoint | null,
    ): Promise<ArenaPlacementResult> => {
      if (!enabled || !sceneId) return { ok: false, error: ARENA_PLACEMENT_TEXTS.noScene };
      const point = at ?? controlsRef.current?.visibleCenter() ?? null;
      if (!point) return { ok: false, error: ARENA_PLACEMENT_TEXTS.noScene };
      const result = await createArenaToken(sceneId, {
        ...input,
        ...placementPoint(point, boundsRef.current),
      });
      if (isErrorResult(result)) return { ok: false, error: result.error };
      const { token } = result.payload;
      store.getState().applyArenaToken(token);
      if (store.getState().arena.view?.scene?.id === token.sceneId)
        store.getState().selectArenaTokens([token.id], "replace");
      return { ok: true, tokenId: token.id };
    },
    [enabled, sceneId, controlsRef, boundsRef, store],
  );

  const placeSheet = useCallback(
    async (character: ICharacterSummary, at: IArenaPoint | null) => {
      const outcome = await create({ characterId: character.id }, at);
      if (!outcome.ok) onError(outcome.error);
    },
    [create, onError],
  );

  const dropCharacter = useCallback(
    (character: ICharacterSummary, point: { x: number; y: number }) => {
      const world = controlsRef.current?.clientToWorld(point.x, point.y) ?? null;
      if (world) void placeSheet(character, world);
    },
    [controlsRef, placeSheet],
  );

  const submitNpc = useCallback(
    async (name: string, file: File | null) => {
      const outcome = await create({ name }, null);
      if (!outcome.ok) return outcome.error;
      setNpcDialogOpen(false);
      if (file) {
        const uploaded = await uploadArenaTokenImage(outcome.tokenId, file);
        if (isErrorResult(uploaded))
          onError(`${ARENA_PLACEMENT_TEXTS.imageNotSent} ${uploaded.error}`);
      }
      return null;
    },
    [create, onError],
  );

  const placeCharacter = useCallback(
    (character: ICharacterSummary) => void placeSheet(character, null),
    [placeSheet],
  );
  const openNpcDialog = useCallback(() => setNpcDialogOpen(true), []);
  const closeNpcDialog = useCallback(() => setNpcDialogOpen(false), []);

  return useMemo(
    () => ({
      placeCharacter,
      dropCharacter,
      npcDialogOpen,
      openNpcDialog,
      closeNpcDialog,
      submitNpc,
    }),
    [placeCharacter, dropCharacter, npcDialogOpen, openNpcDialog, closeNpcDialog, submitNpc],
  );
}
