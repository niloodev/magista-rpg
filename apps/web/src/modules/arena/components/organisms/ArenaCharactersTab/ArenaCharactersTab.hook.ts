"use client";

import type { ICharacterSummary } from "@magista/shared";
import { createElement, useMemo } from "react";

import { toMediaUrl } from "@/core/services/http";
import { ArenaTokenDragPreview } from "@/modules/arena/components/molecules";
import { portraitOf } from "@/modules/sheet/sheet.utils";

import type { ArenaCharactersTabProps } from "./ArenaCharactersTab.types";

/**
 * While the GM drags a sheet over the map, the row preview becomes the token it is about to create, at the size
 * it will have on screen.
 */
export function useArenaCharactersTab({
  isOverMap,
  tokenPreviewSize,
}: Pick<ArenaCharactersTabProps, "isOverMap" | "tokenPreviewSize">) {
  const dropPreview = useMemo(
    () => ({
      isOver: isOverMap,
      render: (character: ICharacterSummary) =>
        createElement(ArenaTokenDragPreview, {
          name: character.name,
          portraitUrl: toMediaUrl(portraitOf(character)),
          size: tokenPreviewSize(),
        }),
    }),
    [isOverMap, tokenPreviewSize],
  );
  return { dropPreview };
}
