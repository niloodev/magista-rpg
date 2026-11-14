import {
  CRITICAL_BADGE_LABEL,
  HEXAGON,
  NATURAL_LABELS,
  ROLL_CARD_STYLES,
  ROLLED_BY_GM_LABEL,
} from "@/modules/table/table.constants";
import { Icon, Skeleton, skeletonSample } from "@/shared/components/atoms";
import { AvatarSkeleton } from "@/shared/components/molecules";

import { MORE_LABEL } from "./RollCardSkeleton.constants";
import type { RollCardSkeletonProps } from "./RollCardSkeleton.types";

/**
 * Placeholder of a `RollCard` with the stored shape of a real card: each result row (label length, dice chips,
 * modifier and natural label; the large hexagon on the first row and on a natural 20) and the length of each note, so it wraps
 * and grows like the real card.
 */
export function RollCardSkeleton({ card }: RollCardSkeletonProps) {
  return (
    <li
      className={`relative shrink-0 overflow-hidden border ${ROLL_CARD_STYLES[card.critical ? "critical" : card.levelUp ? "levelUp" : "normal"]}`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2">
        <AvatarSkeleton size="sm" />
        <div className="min-w-0 flex-1">
          <p className="overflow-hidden font-sans text-sm font-semibold text-clip whitespace-nowrap">
            <Skeleton shape="glyphs">{skeletonSample(card.name)}</Skeleton>
          </p>
          {card.byGm && <p className="font-sans text-xs text-teal-300">{ROLLED_BY_GM_LABEL}</p>}
        </div>
        {card.critical && (
          <span className="flex items-center gap-1 border border-gold-400/70 bg-gold-500/20 px-2 py-1 font-sans text-xs font-bold tracking-widest text-gold-200 uppercase">
            <Icon name="crown" size={14} /> {CRITICAL_BADGE_LABEL}
          </span>
        )}
        <span className="font-sans text-xs">
          <Skeleton shape="glyphs">00:00</Skeleton>
        </span>
      </div>
      <div className="relative space-y-3 p-3">
        <p className="flex items-center gap-2 font-sans text-[15px] font-bold tracking-wide">
          <Icon name="dices" size={16} className="text-accent-text/50" />
          <span className="overflow-hidden text-clip whitespace-nowrap">
            <Skeleton shape="glyphs" tone="ruby">
              {skeletonSample(card.title)}
            </Skeleton>
          </span>
          {card.subtitle > 0 && (
            <span className="shrink-0 text-xs font-normal tracking-wider uppercase">
              <Skeleton shape="glyphs">{skeletonSample(card.subtitle)}</Skeleton>
            </span>
          )}
        </p>
        {card.rows.map((row, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-sans text-sm">
                <Skeleton shape="glyphs">{skeletonSample(row.label)}</Skeleton>
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {Array.from({ length: row.chips }, (_, chip) => (
                  <span key={chip} className="h-7 w-7 border border-white/15 bg-white/5" />
                ))}
                {row.modifier > 0 && (
                  <span className="font-sans text-sm">
                    <Skeleton shape="glyphs">{skeletonSample(row.modifier)}</Skeleton>
                  </span>
                )}
                {row.natural > 0 && (
                  <span className="ml-1 font-sans text-xs font-bold tracking-wider uppercase">
                    <Skeleton shape="glyphs">{skeletonSample(row.natural)}</Skeleton>
                  </span>
                )}
              </div>
            </div>
            <span
              className={`shrink-0 ${index === 0 || row.natural === NATURAL_LABELS.critical.length ? "h-14 w-12" : "h-12 w-11"}`}
              style={{ clipPath: HEXAGON }}
            >
              <Skeleton
                shape="block"
                tone={index === 0 ? "ruby" : "teal"}
                className="h-full w-full"
              />
            </span>
          </div>
        ))}
        {card.short.length > 0 && (
          <ul className="space-y-1 border-t border-white/10 pt-2">
            {card.short.map((length, note) => (
              <li key={note} className="font-sans text-[13px] leading-snug">
                <Skeleton shape="glyphs">{skeletonSample(length)}</Skeleton>
              </li>
            ))}
          </ul>
        )}
        {card.long.map((length, note) => (
          <div key={note} className="border-t border-white/10 pt-2 text-sm">
            <div className="max-h-12 overflow-hidden font-sans text-[15px] leading-relaxed">
              <Skeleton shape="glyphs">{skeletonSample(length)}</Skeleton>
            </div>
            <span className="mt-2 inline-flex min-h-8 items-center gap-1 font-sans text-sm font-semibold text-accent-text">
              {MORE_LABEL}
              <Icon name="chevron-down" size={16} />
            </span>
          </div>
        ))}
      </div>
    </li>
  );
}
