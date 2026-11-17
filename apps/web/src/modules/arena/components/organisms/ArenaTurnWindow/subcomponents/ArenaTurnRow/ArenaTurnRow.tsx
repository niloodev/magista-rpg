import { memo } from "react";

import { ARENA_TURN_TEXTS } from "@/modules/arena/arena.constants";
import { Avatar, Icon } from "@/shared/components/atoms";
import { ActionMenu } from "@/shared/components/molecules";

import { TurnInitiativeHex } from "../TurnInitiativeHex";
import {
  TURN_ROW_CLASSES,
  TURN_ROW_TAG_CLASSES,
  TURN_ROW_TONE_CLASSES,
} from "./ArenaTurnRow.constants";
import type { ArenaTurnRowProps } from "./ArenaTurnRow.types";

/**
 * One line of the turn order: the initiative in a hexagon (gold on the current turn, spinning while rolled), the
 * portrait and name (picking them shows the token on the map) with "Vez atual" or "A seguir", and, for the GM,
 * a menu to give the turn to the token or take it out of the order.
 */
export const ArenaTurnRow = memo(function ArenaTurnRow({
  row,
  isGm,
  onPick,
  onSetInitiative,
  onFocus,
  onRemove,
}: ArenaTurnRowProps) {
  const tag = row.current ? "current" : row.upNext ? "upNext" : null;
  return (
    <div
      aria-current={row.current ? "step" : undefined}
      className={`${TURN_ROW_CLASSES.base} ${row.current ? TURN_ROW_CLASSES.current : TURN_ROW_CLASSES.idle}`}
    >
      <TurnInitiativeHex
        value={row.initiative}
        rolling={row.rolling}
        current={row.current}
        editable={isGm}
        label={ARENA_TURN_TEXTS.initiative(row.name)}
        onCommit={(value) => onSetInitiative(row.id, value)}
      />
      <button
        type="button"
        onClick={() => onPick(row.id)}
        title={ARENA_TURN_TEXTS.pick(row.name)}
        className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left"
      >
        <Avatar
          src={row.imageUrl}
          name={row.name}
          size="xs"
          shape={row.style === "figure" ? "figure" : "circle"}
          decorative
          className={`!h-9 !w-9 shrink-0 ${TURN_ROW_TONE_CLASSES[row.tone]} ${row.hidden ? "opacity-50" : ""}`}
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={`truncate font-serif text-[15px] leading-5 ${row.current ? "text-gold-200" : "text-foreground"}`}
          >
            {row.name}
          </span>
          {tag && (
            <span
              className={`font-sans text-xs leading-4 font-semibold tracking-wider uppercase ${TURN_ROW_TAG_CLASSES[tag]}`}
            >
              {tag === "current" ? ARENA_TURN_TEXTS.current : ARENA_TURN_TEXTS.upNext}
            </span>
          )}
        </span>
        {row.hidden && (
          <Icon
            name="eye-off"
            size={14}
            aria-hidden="true"
            className="shrink-0 text-muted-strong"
          />
        )}
      </button>
      {isGm && (
        <ActionMenu
          label={ARENA_TURN_TEXTS.rowActions(row.name)}
          items={[
            {
              label: ARENA_TURN_TEXTS.focus(row.name),
              icon: "play",
              onSelect: () => onFocus(row.id),
            },
            {
              label: ARENA_TURN_TEXTS.remove(row.name),
              icon: "list-x",
              destructive: true,
              onSelect: () => onRemove(row.id),
            },
          ]}
        />
      )}
    </div>
  );
});
