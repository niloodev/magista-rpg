"use client";

import { ARENA_INITIATIVE_MAX, ARENA_INITIATIVE_MIN } from "@magista/shared";
import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from "react";

import { PENDING_ROLL_TICK_MS } from "@/modules/table/table.constants";
import { usePrefersReducedMotion } from "@/shared/hooks";

import type { TurnInitiativeHexProps } from "./TurnInitiativeHex.types";
import { randomInitiativeFace } from "./TurnInitiativeHex.utils";

/**
 * The initiative of a turn order line: while rolling, a d20 face changing fast (as the pending card of the feed,
 * a still "?" with reduced motion or in performance mode); for the GM, a draft committed on blur or Enter (Esc
 * drops it, empty clears the value, a draft with no digit such as "-" is dropped).
 */
export function useTurnInitiativeHex({
  value,
  rolling,
  onCommit,
}: Pick<TurnInitiativeHexProps, "value" | "rolling" | "onCommit">) {
  const reducedMotion = usePrefersReducedMotion();
  const [face, setFace] = useState(randomInitiativeFace);
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    if (!rolling || reducedMotion) return;
    const timer = window.setInterval(() => setFace(randomInitiativeFace()), PENDING_ROLL_TICK_MS);
    return () => window.clearInterval(timer);
  }, [rolling, reducedMotion]);

  const commit = () => {
    if (draft === null) return;
    setDraft(null);
    if (draft !== "" && !/\d/.test(draft)) return;
    const parsed = Number.parseInt(draft, 10);
    const next = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, ARENA_INITIATIVE_MIN), ARENA_INITIATIVE_MAX)
      : null;
    if (next !== value) onCommit(next);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) =>
    setDraft(event.target.value.replace(/[^\d-]/g, "").slice(0, 4));

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape" && draft !== null) {
      event.preventDefault();
      event.stopPropagation();
      setDraft(null);
    }
  };

  return {
    face: reducedMotion ? "?" : String(face),
    text: draft ?? (value === null ? "" : String(value)),
    onChange,
    onBlur: commit,
    onKeyDown,
  };
}
