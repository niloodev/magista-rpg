"use client";

import { MarkedSigil } from "@/modules/marked/components/atoms";
import { MARKED_RISING_RUNES, MARKED_RUNE_PATHS } from "@/modules/marked/marked.constants";

import { useMarkedBackdrop } from "./MarkedBackdrop.hook";

export function MarkedBackdrop() {
  const { visible } = useMarkedBackdrop();
  if (!visible) return null;
  return (
    <div
      aria-hidden="true"
      data-testid="marked-backdrop"
      className="pointer-events-none fixed inset-0 -z-10 animate-marked-fade overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_30%,rgba(218,32,84,0.22),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgba(251,191,36,0.07),transparent_50%)]" />
      <div className="absolute top-[4vh] -right-[28vmin] h-[118vmin] w-[118vmin] opacity-[0.22] max-md:top-[18vh] max-md:-right-[45vmin]">
        <MarkedSigil animated className="h-full w-full" />
      </div>
      {MARKED_RISING_RUNES.map((rune) => (
        <svg
          key={rune.left}
          viewBox="-7 -11 14 22"
          fill="none"
          stroke="var(--magista-ruby-400)"
          strokeWidth="1.6"
          strokeLinecap="round"
          className={`absolute -bottom-12 aspect-[14/22] animate-marked-rise opacity-0 lite:hidden ${rune.size}`}
          style={{ left: rune.left, animationDelay: rune.delay }}
        >
          <path d={MARKED_RUNE_PATHS[rune.rune]} />
        </svg>
      ))}
    </div>
  );
}
