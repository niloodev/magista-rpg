"use client";

import { ROLL_PHASES_MS } from "@magista/shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { FADE_OUT_MS, SPIN_INTERVAL_MS } from "./DiceRollOverlay.constants";
import type { DicePhase, DiceRollOverlayProps } from "./DiceRollOverlay.types";
import { diceRange, naturalOf, prefersReducedMotion, splitOutcome } from "./DiceRollOverlay.utils";

/**
 * Drives the prototype's three-phase roll animation: spinning numbers, dice plus modifier, final result.
 */
export function useDiceRollOverlay({ roll, onClose }: DiceRollOverlayProps) {
  const [reducedMotion] = useState(prefersReducedMotion);
  const [phase, setPhase] = useState<DicePhase>(reducedMotion ? "result" : "rolling");
  const [leaving, setLeaving] = useState(false);
  const primary = roll.rows[0];
  const range = primary ? diceRange(primary.outcome) : { min: 1, max: 20 };
  const [spinValue, setSpinValue] = useState(range.max);

  const closeTimer = useRef<number | null>(null);

  const close = useCallback(() => {
    if (closeTimer.current !== null) return;
    setLeaving(true);
    closeTimer.current = window.setTimeout(onClose, FADE_OUT_MS);
  }, [onClose]);

  useEffect(
    () => () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (phase !== "rolling") return;
    const low = Math.max(1, range.min);
    const spin = window.setInterval(
      () => setSpinValue(low + Math.floor(Math.random() * (Math.max(low, range.max) - low + 1))),
      SPIN_INTERVAL_MS,
    );
    const next = window.setTimeout(() => setPhase("adding"), ROLL_PHASES_MS.rolling);
    return () => {
      window.clearInterval(spin);
      window.clearTimeout(next);
    };
  }, [phase, range.min, range.max]);

  useEffect(() => {
    if (phase !== "adding") return;
    const next = window.setTimeout(() => setPhase("result"), ROLL_PHASES_MS.adding);
    return () => window.clearTimeout(next);
  }, [phase]);

  useEffect(() => {
    if (phase !== "result") return;
    const timer = window.setTimeout(close, ROLL_PHASES_MS.result);
    return () => window.clearTimeout(timer);
  }, [phase, close]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const split = primary ? splitOutcome(primary.outcome) : { dice: 0, modifier: 0 };

  return {
    phase,
    leaving,
    spinValue,
    primary,
    secondary: roll.rows.slice(1),
    dice: split.dice,
    modifier: split.modifier,
    natural: primary ? naturalOf(primary.outcome) : null,
    close,
  };
}
