"use client";

import { useId, useRef, useState, type FormEvent } from "react";

import { SCENE_TEXTS } from "@/modules/arena/arena.constants";

import type { IBoardDraft, SceneBoardDialogProps } from "./SceneBoardDialog.types";
import { followRatio, formatUnits, isBoardSide, parseUnits } from "./SceneBoardDialog.utils";

/**
 * Draft of the board size in units: with a map the height always follows the width by the map's aspect ratio
 * (and back), without a map both sides are free. Saves in pixels.
 */
export function useSceneBoardDialog({
  scene,
  onSubmit,
}: Pick<SceneBoardDialogProps, "scene" | "onSubmit">) {
  const formId = useId();
  const map =
    scene.mapWidth !== null && scene.mapHeight !== null
      ? { width: scene.mapWidth, height: scene.mapHeight }
      : null;
  const ratio = map ? map.height / map.width : null;
  const [draft, setDraft] = useState<IBoardDraft>({
    width: formatUnits(scene.width),
    height: formatUnits(scene.height),
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const widthRef = useRef<HTMLInputElement | null>(null);
  const heightRef = useRef<HTMLInputElement | null>(null);

  const width = parseUnits(draft.width);
  const height = parseUnits(draft.height);

  const change = (field: keyof IBoardDraft, text: string) => {
    setDraft((current) => followRatio(current, field, text, ratio));
    setError(null);
  };

  const resetToOriginal = () => {
    if (!map) return;
    setDraft({ width: formatUnits(map.width), height: formatUnits(map.height) });
    setError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (!isBoardSide(width) || !isBoardSide(height)) {
      setError(SCENE_TEXTS.boardInvalid);
      (isBoardSide(width) ? heightRef : widthRef).current?.focus();
      return;
    }
    setPending(true);
    const failure = await onSubmit(ratio === null ? { width, height } : { width });
    setPending(false);
    if (failure) {
      setError(failure);
      widthRef.current?.focus();
    }
  };

  return {
    formId,
    widthRef,
    heightRef,
    describedBy: error ? `${formId}-pixels ${formId}-error` : `${formId}-pixels`,
    draft,
    error,
    pending,
    locked: ratio !== null,
    pixels:
      width !== null && height !== null
        ? SCENE_TEXTS.boardPixels(Math.round(width), Math.round(height))
        : null,
    mapSize: map ? SCENE_TEXTS.boardMapSize(map.width, map.height) : null,
    onWidthChange: (text: string) => change("width", text),
    onHeightChange: (text: string) => change("height", text),
    resetToOriginal,
    submit,
  };
}
