"use client";

import {
  ARENA_TOKEN_IMAGE_MAX_BYTES,
  isErrorResult,
  type TokenStyle,
  type IArenaPoint,
  type ICharacterSummary,
  type ICreateArenaTokenInput,
} from "@magista/shared";
import { useCallback, useMemo, useState } from "react";

import { ARENA_IMAGE_DROP_MAX, ARENA_PLACEMENT_TEXTS } from "@/modules/arena/arena.constants";
import { dropPlacements, placementPoint, tokenNameFromFile } from "@/modules/arena/arena.utils";
import { createArenaToken, uploadArenaTokenImage } from "@/modules/arena/services";
import { useAppStoreApi } from "@/modules/shell/store";
import { imageFileError } from "@/shared/components/molecules";

import type {
  IArenaImageDrop,
  ArenaPlacementResult,
  IArenaTokenPlacement,
  UseArenaTokenPlacementProps,
} from "./useArenaTokenPlacement.types";

/**
 * GM token creation in the Arena: a sheet dropped on the map (at the drop point), "Colocar no mapa" and NPC
 * tokens (at the center of the view) and images dropped from the computer (where they fall, after asking the
 * style). The new token shows at once, selected, and the table gets it by event.
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
  const [imageDrop, setImageDrop] = useState<IArenaImageDrop | null>(null);

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
    async (name: string, file: File | null, style: TokenStyle) => {
      const outcome = await create({ name, style }, null);
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

  const dropImages = useCallback(
    (files: File[], point: { x: number; y: number }) => {
      if (!enabled || !sceneId) return;
      const world = controlsRef.current?.clientToWorld(point.x, point.y) ?? null;
      if (!world) return;
      const images = files.filter(
        (file) =>
          imageFileError(file, ARENA_TOKEN_IMAGE_MAX_BYTES, ARENA_PLACEMENT_TEXTS.imageTooLarge) ===
          null,
      );
      if (images.length === 0) {
        onError(ARENA_PLACEMENT_TEXTS.dropInvalid);
        return;
      }
      setImageDrop({ files: images.slice(0, ARENA_IMAGE_DROP_MAX), point: world });
    },
    [enabled, sceneId, controlsRef, onError],
  );

  const submitImageDrop = useCallback(
    async (names: string[], style: TokenStyle) => {
      if (!imageDrop) return null;
      const points = dropPlacements(imageDrop.point, imageDrop.files.length, boundsRef.current);
      const created: string[] = [];
      const failures: string[] = [];
      for (const [index, file] of imageDrop.files.entries()) {
        const name = names[index]?.trim() || tokenNameFromFile(file.name);
        const outcome = await create({ name, style }, points[index] ?? imageDrop.point);
        if (!outcome.ok) {
          if (created.length === 0) return outcome.error;
          failures.push(outcome.error);
          continue;
        }
        created.push(outcome.tokenId);
        const uploaded = await uploadArenaTokenImage(outcome.tokenId, file);
        if (isErrorResult(uploaded)) failures.push(`${name}: ${uploaded.error}`);
      }
      setImageDrop(null);
      if (created.length > 1 && store.getState().arena.view?.scene?.id === sceneId)
        store.getState().selectArenaTokens(created, "replace");
      if (failures.length > 0)
        onError(`${ARENA_PLACEMENT_TEXTS.imageNotSent} ${failures.join(" ")}`);
      return null;
    },
    [imageDrop, boundsRef, create, store, sceneId, onError],
  );

  const closeImageDrop = useCallback(() => setImageDrop(null), []);

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
      imageDropFiles: imageDrop?.files ?? null,
      dropImages,
      submitImageDrop,
      closeImageDrop,
    }),
    [
      placeCharacter,
      dropCharacter,
      npcDialogOpen,
      openNpcDialog,
      closeNpcDialog,
      submitNpc,
      imageDrop,
      dropImages,
      submitImageDrop,
      closeImageDrop,
    ],
  );
}
