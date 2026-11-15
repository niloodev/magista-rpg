"use client";

import { useEffect, useState } from "react";

import { PENDING_ROLL_TICK_MS } from "@/modules/table/table.constants";
import { usePrefersReducedMotion } from "@/shared/hooks";

import { randomFace } from "./RollPendingCard.utils";

/**
 * The face shown while the dice are still rolling: a d20 number changing fast, like the roller's own
 * animation. Stays on "?" with reduced motion or in performance mode.
 */
export function useRollPendingCard() {
  const reducedMotion = usePrefersReducedMotion();
  const [face, setFace] = useState(randomFace);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => setFace(randomFace()), PENDING_ROLL_TICK_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return { face: reducedMotion ? "?" : String(face) };
}
