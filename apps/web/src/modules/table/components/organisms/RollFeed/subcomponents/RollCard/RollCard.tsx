import { toMediaUrl } from "@/core/services/http";
import {
  CRITICAL_BADGE_LABEL,
  ROLL_CARD_STYLES,
  ROLLED_BY_GM_LABEL,
} from "@/modules/table/table.constants";
import { hasCritical, splitNotes } from "@/modules/table/table.utils";
import { Avatar, Icon } from "@/shared/components/atoms";
import { ExpandableText } from "@/shared/components/molecules";

import { KIND_ICONS } from "./RollCard.constants";
import type { RollCardProps } from "./RollCard.types";
import { formatTime } from "./RollCard.utils";
import { RollRow } from "./subcomponents";

export function RollCard({ roll }: RollCardProps) {
  const notes = splitNotes(roll.notes);
  const critical = hasCritical(roll.rows);
  const variant = critical ? "critical" : roll.kind === "levelUp" ? "levelUp" : "normal";
  return (
    <li
      className={`animate-roll-in relative shrink-0 overflow-hidden border transition-colors ${ROLL_CARD_STYLES[variant]}`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2">
        <Avatar src={toMediaUrl(roll.portraitUrl)} name={roll.characterName} size="sm" decorative />
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-sm font-semibold text-foreground">
            {roll.characterName}
          </p>
          {roll.rolledByGm && (
            <p className="font-sans text-xs text-teal-300">{ROLLED_BY_GM_LABEL}</p>
          )}
        </div>
        {critical && (
          <span className="flex items-center gap-1 border border-gold-400/70 bg-gold-500/20 px-2 py-1 font-sans text-xs font-bold tracking-widest text-gold-200 uppercase">
            <Icon name="crown" size={14} /> {CRITICAL_BADGE_LABEL}
          </span>
        )}
        <time dateTime={roll.createdAt} className="font-sans text-xs text-muted-strong">
          {formatTime(roll.createdAt)}
        </time>
      </div>
      <div className="relative space-y-3 p-3">
        <p
          className={`flex items-center gap-2 font-sans text-[15px] font-bold tracking-wide ${critical ? "text-gold-300" : roll.kind === "levelUp" ? "text-teal-300" : "text-accent-text"}`}
        >
          <Icon name={KIND_ICONS[roll.kind]} size={16} />
          <span className="truncate">{roll.title}</span>
          <span className="shrink-0 font-normal text-xs tracking-wider text-muted-strong uppercase">
            {roll.subtitle}
          </span>
        </p>
        {roll.rows.map((row, index) => (
          <RollRow key={row.label} row={row} primary={index === 0} />
        ))}
        {notes.short.length > 0 && (
          <ul className="space-y-1 border-t border-white/10 pt-2">
            {notes.short.map((note) => (
              <li key={note} className="font-sans text-[13px] leading-snug text-muted-strong">
                {note}
              </li>
            ))}
          </ul>
        )}
        {notes.long.map((note) => (
          <ExpandableText
            key={note}
            text={note}
            collapsedHeight={48}
            className="border-t border-white/10 pt-2 text-sm"
          />
        ))}
      </div>
    </li>
  );
}
