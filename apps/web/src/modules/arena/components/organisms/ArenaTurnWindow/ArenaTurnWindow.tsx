"use client";

import { memo } from "react";

import { ARENA_TURN_TEXTS, ARENA_TURN_WINDOW_LAYOUT } from "@/modules/arena/arena.constants";
import { HEXAGON } from "@/modules/table/table.constants";
import { Button, Icon, Text } from "@/shared/components/atoms";
import { FloatingWindow, SortableList } from "@/shared/components/organisms";

import {
  NO_ACTIVATION,
  TURN_HEADER_CLASSES,
  TURN_ICON_BUTTON,
  TURN_ROUND_HEX_CLASSES,
} from "./ArenaTurnWindow.constants";
import { useArenaTurnWindow } from "./ArenaTurnWindow.hook";
import type { ArenaTurnWindowProps } from "./ArenaTurnWindow.types";
import { ArenaTurnRow } from "./subcomponents";

/**
 * The turn order of the scene in a small floating window (the Roll20 "Turn Order"): the round in a gold
 * hexagon and whose turn it is, the GM's controls (previous, next, sort, clear) or the player's "end my turn",
 * and the tokens in order with their initiative, the current one in gold and the next one marked. The GM drags
 * lines to reorder and types values in place; lines being rolled spin until the dice reveal.
 */
export const ArenaTurnWindow = memo(function ArenaTurnWindow(props: ArenaTurnWindowProps) {
  const { isGm, rows, round, currentName, started, yourTurn } = props;
  const { onNext, onPrevious, onEndTurn, onSort, onRequestClear } = props;
  const { onSetInitiative, onMove, onRemove, onFocus, onPick, onClose } = props;
  const { rect, onRectChange } = useArenaTurnWindow(props);
  const renderRow = (row: ArenaTurnWindowProps["rows"][number]) => (
    <ArenaTurnRow
      row={row}
      isGm={isGm}
      onPick={onPick}
      onSetInitiative={onSetInitiative}
      onFocus={onFocus}
      onRemove={onRemove}
    />
  );
  return (
    <FloatingWindow
      title={ARENA_TURN_TEXTS.windowTitle}
      rect={rect}
      zIndex={ARENA_TURN_WINDOW_LAYOUT.zIndex}
      minSize={ARENA_TURN_WINDOW_LAYOUT.min}
      minTop={ARENA_TURN_WINDOW_LAYOUT.top - ARENA_TURN_WINDOW_LAYOUT.gap}
      onRectChange={onRectChange}
      onActivate={NO_ACTIVATION}
      onClose={onClose}
      closeLabel={ARENA_TURN_TEXTS.close}
    >
      <div className={TURN_HEADER_CLASSES}>
        <div className="flex items-center gap-3">
          <span className={TURN_ROUND_HEX_CLASSES}>
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gold-400/70"
              style={{ clipPath: HEXAGON }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-[2px] bg-void-900"
              style={{ clipPath: HEXAGON }}
            />
            <span className="relative">
              <span className="sr-only">{ARENA_TURN_TEXTS.round} </span>
              {round}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <Text variant="micro" className="block text-gold-300">
              {started ? ARENA_TURN_TEXTS.turnOfLabel : ARENA_TURN_TEXTS.roundLabel(round)}
            </Text>
            <p
              className={`truncate font-serif text-base leading-6 ${started ? "text-gold-200" : "text-muted-strong"}`}
            >
              {started && currentName ? currentName : ARENA_TURN_TEXTS.notStarted}
            </p>
          </div>
        </div>
        {isGm && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPrevious}
              disabled={rows.length === 0}
              aria-label={ARENA_TURN_TEXTS.previous}
              title={ARENA_TURN_TEXTS.previous}
              className={TURN_ICON_BUTTON}
            >
              <Icon name="skip-back" size={16} aria-hidden="true" />
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={onNext}
              disabled={rows.length === 0}
              icon={<Icon name={started ? "skip-forward" : "play"} size={12} />}
              className="h-10 min-w-0 flex-1"
            >
              {started ? ARENA_TURN_TEXTS.next : ARENA_TURN_TEXTS.start}
            </Button>
            <button
              type="button"
              onClick={onSort}
              disabled={rows.length < 2}
              aria-label={ARENA_TURN_TEXTS.sort}
              title={ARENA_TURN_TEXTS.sort}
              className={TURN_ICON_BUTTON}
            >
              <Icon name="arrow-down-wide-narrow" size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onRequestClear}
              disabled={rows.length === 0}
              aria-label={ARENA_TURN_TEXTS.clear}
              title={ARENA_TURN_TEXTS.clear}
              className={TURN_ICON_BUTTON}
            >
              <Icon name="trash-2" size={16} aria-hidden="true" />
            </button>
          </div>
        )}
        {yourTurn && (
          <Button
            variant="primary"
            size="sm"
            onClick={onEndTurn}
            icon={<Icon name="skip-forward" size={12} />}
            className="h-10 w-full"
          >
            {ARENA_TURN_TEXTS.endTurn}
          </Button>
        )}
      </div>
      <div className="p-2.5">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-3 py-8 text-center">
            <Icon name="list-ordered" size={28} aria-hidden="true" className="text-primary/60" />
            <p className="font-sans text-sm text-muted-strong">
              {isGm ? ARENA_TURN_TEXTS.emptyGm : ARENA_TURN_TEXTS.empty}
            </p>
          </div>
        ) : isGm ? (
          <SortableList
            label={ARENA_TURN_TEXTS.listLabel}
            items={rows}
            itemName={(row) => row.name}
            onMove={onMove}
            renderItem={renderRow}
            className="space-y-1.5"
          />
        ) : (
          <ol aria-label={ARENA_TURN_TEXTS.listLabel} className="space-y-1.5">
            {rows.map((row) => (
              <li key={row.id} className="flex">
                {renderRow(row)}
              </li>
            ))}
          </ol>
        )}
      </div>
    </FloatingWindow>
  );
});
