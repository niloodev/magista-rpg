"use client";

import { useId } from "react";

import { OTHALA_PATH, SIGIL_RING_RUNES, SIGIL_SPIN_CLASSES } from "./MarkedSigil.constants";
import type { MarkedSigilProps } from "./MarkedSigil.types";

export function MarkedSigil({ className, runes = true, animated = false }: MarkedSigilProps) {
  const glowId = useId();
  const spin = animated ? SIGIL_SPIN_CLASSES : null;
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden="true" className={className}>
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--magista-gold-400)" stopOpacity="0.45" />
          <stop offset="60%" stopColor="var(--magista-ruby-600)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--magista-ruby-600)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {runes && (
        <g className={spin?.outer} stroke="var(--magista-ruby-400)">
          <circle cx="200" cy="200" r="194" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="186" strokeWidth="5" strokeDasharray="2 14" />
          <circle cx="200" cy="200" r="150" strokeWidth="1" />
        </g>
      )}
      {runes && (
        <g
          className={spin?.runes}
          stroke="var(--magista-ruby-400)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {SIGIL_RING_RUNES.map((rune) => (
            <path key={rune.key} d={rune.path} transform={rune.transform} />
          ))}
        </g>
      )}
      <g className={spin?.core}>
        <circle cx="200" cy="200" r="132" fill={`url(#${glowId})`} />
        <circle cx="200" cy="200" r="132" stroke="var(--magista-gold-400)" strokeWidth="1.5" />
        <path
          d={OTHALA_PATH}
          stroke="var(--magista-ruby-600)"
          strokeWidth="30"
          strokeLinecap="square"
          strokeLinejoin="miter"
          opacity="0.55"
        />
        <path
          d={OTHALA_PATH}
          stroke="var(--magista-gold-300)"
          strokeWidth="14"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </g>
    </svg>
  );
}
