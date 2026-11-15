"use client";

import { toMediaUrl } from "@/core/services/http";
import {
  HEXAGON,
  PENDING_ROLL_LABEL,
  ROLL_CARD_STYLES,
  ROLLED_BY_GM_LABEL,
  ROLL_KIND_ICONS,
} from "@/modules/table/table.constants";
import { Avatar, Icon } from "@/shared/components/atoms";

import { useRollPendingCard } from "./RollPendingCard.hook";
import type { RollPendingCardProps } from "./RollPendingCard.types";

/**
 * A roll the table already knows is happening (who rolls what) while the dice are still in the air: the
 * result only appears when the roller's own animation reveals it.
 */
export function RollPendingCard({ pending }: RollPendingCardProps) {
  const { face } = useRollPendingCard();
  return (
    <li
      className={`animate-roll-in relative shrink-0 overflow-hidden border transition-colors ${ROLL_CARD_STYLES.normal}`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2">
        <Avatar
          src={toMediaUrl(pending.portraitUrl)}
          name={pending.characterName}
          size="sm"
          decorative
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-sm font-semibold text-foreground">
            {pending.characterName}
          </p>
          <p className="font-sans text-xs text-muted-strong italic">
            {pending.rolledByGm ? `${ROLLED_BY_GM_LABEL} · ` : ""}
            {PENDING_ROLL_LABEL}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 p-3">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 animate-pulse-breath items-center justify-center bg-primary/25 font-serif text-2xl text-foreground lite:animate-none"
          style={{ clipPath: HEXAGON }}
        >
          {face}
        </span>
        <p className="flex min-w-0 flex-1 items-center gap-2 font-sans text-[15px] font-bold tracking-wide text-accent-text">
          <Icon name={ROLL_KIND_ICONS[pending.kind]} size={16} />
          <span className="truncate">{pending.title}</span>
          <span className="shrink-0 text-xs font-normal tracking-wider text-muted-strong uppercase">
            {pending.subtitle}
          </span>
        </p>
      </div>
    </li>
  );
}
