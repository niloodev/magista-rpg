"use client";

import { ARENA_TURN_TEXTS } from "@/modules/arena/arena.constants";
import { HEXAGON } from "@/modules/table/table.constants";

import {
  TURN_HEX_CLASSES,
  TURN_HEX_INPUT_CLASSES,
  TURN_HEX_SHAPE_CLASSES,
} from "./TurnInitiativeHex.constants";
import { useTurnInitiativeHex } from "./TurnInitiativeHex.hook";
import type { TurnInitiativeHexProps } from "./TurnInitiativeHex.types";

/**
 * The initiative of a turn order line in the hexagon of the roll feed: gold on the current turn, spinning while
 * the dice roll, and typed in place by the GM.
 */
export function TurnInitiativeHex(props: TurnInitiativeHexProps) {
  const { rolling, current, editable, label, value } = props;
  const { face, text, onChange, onBlur, onKeyDown } = useTurnInitiativeHex(props);
  const tone = rolling ? "rolling" : current ? "current" : "idle";
  return (
    <span className={`${TURN_HEX_CLASSES.base} ${TURN_HEX_CLASSES[tone]}`}>
      <span
        aria-hidden="true"
        className={`${TURN_HEX_SHAPE_CLASSES.base} ${TURN_HEX_SHAPE_CLASSES[tone]}`}
        style={{ clipPath: HEXAGON }}
      />
      {rolling ? (
        <>
          <span aria-hidden="true" className="relative">
            {face}
          </span>
          <span className="sr-only">
            {label}: {ARENA_TURN_TEXTS.rolling}
          </span>
        </>
      ) : editable ? (
        <input
          type="text"
          inputMode="numeric"
          value={text}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          aria-label={label}
          placeholder={ARENA_TURN_TEXTS.noValue}
          className={TURN_HEX_INPUT_CLASSES}
        />
      ) : (
        <>
          <span aria-hidden="true" className="relative">
            {value ?? ARENA_TURN_TEXTS.noValue}
          </span>
          <span className="sr-only">
            {label}: {value ?? ARENA_TURN_TEXTS.noValueLabel}
          </span>
        </>
      )}
    </span>
  );
}
