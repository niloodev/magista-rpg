"use client";

import { ARENA_CHANGE_AMOUNT_MAX } from "@magista/shared";

import { ARENA_CHANGE_QUICK_AMOUNTS, ARENA_CHANGE_TEXTS } from "@/modules/arena/arena.constants";
import { Avatar, Icon } from "@/shared/components/atoms";
import { NumberField } from "@/shared/components/molecules";

import {
  ATTACKER_CHOICE_CLASS,
  ATTACKER_RING_CLASS,
  KIND_SEGMENTS,
  KIND_TONES,
  RESOURCE_SEGMENTS,
  SECTION_LABEL_CLASS,
  SEGMENT_CLASS,
  STEP_BUTTON_CLASS,
} from "./ArenaChangeMenu.constants";
import { useArenaChangeMenu } from "./ArenaChangeMenu.hook";
import type { ArenaChangeMenuProps } from "./ArenaChangeMenu.types";

/**
 * "Aplicar mudança": opened by the right click on a token (or the M key on the selection). First the action
 * (deal damage or heal), then the attribute (health or sanity), who attacks (by portrait), the amount and the
 * animation (automatic or picked in a list with examples); one button applies it, and Enter does too.
 */
export function ArenaChangeMenu({
  target,
  targetImages,
  anchor,
  preference,
  onPreferenceChange,
  effectLabel,
  autoStyle,
  onPickEffect,
  suspended,
  attackers,
  attackerId,
  onAttackerChange,
  error,
  pending,
  onApply,
  onClose,
}: ArenaChangeMenuProps) {
  const {
    titleId,
    rootRef,
    inputRef,
    amount,
    setAmount,
    invalid,
    pick,
    nudge,
    onSubmit,
    onKeyDown,
    onContextMenu,
    submitLabel,
    attackerHint,
    style,
  } = useArenaChangeMenu({
    anchor,
    preference,
    pending,
    suspended,
    attackers,
    attackerId,
    autoStyle,
    onApply,
    onClose,
  });
  const tone = KIND_TONES[preference.kind];
  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      onContextMenu={onContextMenu}
      style={style}
      className="pointer-events-auto fixed z-50 max-h-[calc(100dvh-1.5rem)] w-[23rem] max-w-[calc(100vw-2rem)] overflow-x-hidden overflow-y-auto border border-primary/35 bg-void-900/95 shadow-[0_24px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(0,0,0,0.6)] backdrop-blur-sm [clip-path:var(--magista-clip-panel)] lite:backdrop-blur-none"
    >
      <header className="relative flex items-center gap-3 border-b border-white/5 bg-gradient-to-r from-ruby-900/40 via-black/20 to-transparent px-4 py-3">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-primary" />
        <span className="flex shrink-0 -space-x-3">
          {targetImages.map((image, index) => (
            <Avatar
              key={index}
              src={image.url}
              name={target}
              size="sm"
              shape={image.style === "figure" ? "figure" : "circle"}
              decorative
            />
          ))}
        </span>
        <div className="min-w-0 flex-1">
          <p id={titleId} className={SECTION_LABEL_CLASS}>
            {ARENA_CHANGE_TEXTS.title}
          </p>
          <p className="truncate font-serif text-lg leading-tight text-gold-300">{target}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={ARENA_CHANGE_TEXTS.close}
          className="flex size-9 shrink-0 items-center justify-center text-muted-strong transition-colors hover:text-label"
        >
          <Icon name="x" size={16} />
        </button>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 overflow-x-clip p-4">
        <fieldset className="grid min-w-0 gap-2">
          <legend className={`${SECTION_LABEL_CLASS} mb-2`}>{ARENA_CHANGE_TEXTS.action}</legend>
          <div className="flex gap-2">
            {KIND_SEGMENTS.map((segment) => (
              <label
                key={segment.value}
                className={`${SEGMENT_CLASS} ${KIND_TONES[segment.value].checked}`}
              >
                <input
                  type="radio"
                  name={`${titleId}-kind`}
                  value={segment.value}
                  checked={preference.kind === segment.value}
                  onChange={() => onPreferenceChange({ kind: segment.value })}
                  className="sr-only"
                />
                <Icon name={segment.icon} size={16} />
                {segment.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="grid min-w-0 gap-2">
          <legend className={`${SECTION_LABEL_CLASS} mb-2`}>{ARENA_CHANGE_TEXTS.resource}</legend>
          <div className="flex gap-2">
            {RESOURCE_SEGMENTS.map((segment) => (
              <label key={segment.value} className={`${SEGMENT_CLASS} ${tone.checked}`}>
                <input
                  type="radio"
                  name={`${titleId}-resource`}
                  value={segment.value}
                  checked={preference.resource === segment.value}
                  onChange={() => onPreferenceChange({ resource: segment.value })}
                  className="sr-only"
                />
                <Icon name={segment.icon} size={16} />
                {segment.label}
              </label>
            ))}
          </div>
        </fieldset>
        {attackers.length > 0 && (
          <fieldset className="grid min-w-0 gap-2">
            <legend className={`${SECTION_LABEL_CLASS} mb-2`}>{ARENA_CHANGE_TEXTS.attacker}</legend>
            <div className="-mx-1 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
              <label className={`group/attacker ${ATTACKER_CHOICE_CLASS}`}>
                <input
                  type="radio"
                  name={`${titleId}-attacker`}
                  value=""
                  checked={attackerId === ""}
                  onChange={() => onAttackerChange("")}
                  className="sr-only"
                />
                <span
                  className={`flex size-10 items-center justify-center border border-white/15 bg-black/50 text-muted-strong ${ATTACKER_RING_CLASS}`}
                >
                  <Icon name="minus" size={16} />
                </span>
                <span className="w-full truncate text-center font-sans text-xs text-muted-strong group-has-checked/attacker:text-gold-300">
                  {ARENA_CHANGE_TEXTS.noAttacker}
                </span>
              </label>
              {attackers.map((attacker) => (
                <label key={attacker.id} className={`group/attacker ${ATTACKER_CHOICE_CLASS}`}>
                  <input
                    type="radio"
                    name={`${titleId}-attacker`}
                    value={attacker.id}
                    checked={attackerId === attacker.id}
                    onChange={() => onAttackerChange(attacker.id)}
                    className="sr-only"
                  />
                  <span className={ATTACKER_RING_CLASS}>
                    <Avatar
                      src={attacker.imageUrl}
                      name={attacker.name}
                      size="sm"
                      shape={attacker.style === "figure" ? "figure" : "circle"}
                      decorative
                    />
                  </span>
                  <span className="w-full truncate text-center font-sans text-xs text-muted-strong group-has-checked/attacker:text-gold-300">
                    {attacker.name}
                  </span>
                </label>
              ))}
            </div>
            <p className="font-sans text-xs text-muted-strong">{attackerHint}</p>
          </fieldset>
        )}
        <div className="grid gap-2">
          <label htmlFor={`${titleId}-amount`} className={SECTION_LABEL_CLASS}>
            {ARENA_CHANGE_TEXTS.amount}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={ARENA_CHANGE_TEXTS.decrease}
              onClick={() => nudge(-1)}
              className={STEP_BUTTON_CLASS}
            >
              <Icon name="minus" size={16} />
            </button>
            <NumberField
              id={`${titleId}-amount`}
              ref={inputRef}
              compact
              min={1}
              max={ARENA_CHANGE_AMOUNT_MAX}
              value={amount}
              onValueChange={setAmount}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? `${titleId}-invalid` : undefined}
              className="h-10 w-20 bg-black/60 px-1 font-serif text-xl text-gold-300 tabular-nums"
            />
            <button
              type="button"
              aria-label={ARENA_CHANGE_TEXTS.increase}
              onClick={() => nudge(1)}
              className={STEP_BUTTON_CLASS}
            >
              <Icon name="plus" size={16} />
            </button>
            <div className="ml-auto flex gap-1">
              {ARENA_CHANGE_QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={ARENA_CHANGE_TEXTS.quick(value)}
                  aria-pressed={amount === value}
                  onClick={() => pick(value)}
                  className="flex size-10 items-center justify-center border border-white/10 bg-black/40 font-serif text-sm text-muted-strong tabular-nums transition-colors hover:border-gold-400/60 hover:text-label aria-pressed:border-gold-400 aria-pressed:bg-gold-400/10 aria-pressed:text-gold-300"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          {invalid && (
            <p id={`${titleId}-invalid`} role="alert" className="font-sans text-sm text-error">
              {ARENA_CHANGE_TEXTS.invalid}
            </p>
          )}
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
          <span className={SECTION_LABEL_CLASS} aria-hidden="true">
            {ARENA_CHANGE_TEXTS.effect}
          </span>
          <button
            type="button"
            onClick={onPickEffect}
            aria-haspopup="dialog"
            aria-label={ARENA_CHANGE_TEXTS.changeEffectLabel(effectLabel)}
            className="group flex min-h-11 min-w-0 items-center gap-3 border border-gold-400/30 bg-gradient-to-r from-gold-400/10 to-black/40 px-3 py-1.5 text-left transition-colors hover:border-gold-400/70"
          >
            <Icon name="wand-sparkles" size={16} className="text-gold-300" />
            <span className="line-clamp-2 min-w-0 flex-1 font-serif text-[15px] leading-tight text-gold-200">
              {effectLabel}
            </span>
            <span className="flex items-center gap-1 font-sans text-xs font-semibold tracking-[0.12em] text-muted-strong uppercase group-hover:text-label">
              {ARENA_CHANGE_TEXTS.changeEffect}
              <Icon name="chevron-right" size={14} />
            </span>
          </button>
        </div>
        {error && (
          <p role="alert" className="font-sans text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={onSubmit}
          className={`flex min-h-12 min-w-0 items-center justify-center gap-2 border px-4 font-serif text-[15px] font-bold whitespace-nowrap transition-shadow duration-200 disabled:opacity-60 ${tone.submit}`}
        >
          <Icon
            name={preference.kind === "damage" ? "swords" : "sparkles"}
            size={16}
            className="shrink-0"
          />
          <span className="truncate">{submitLabel}</span>
        </button>
      </div>
      <footer className="border-t border-white/5 bg-black/30 px-4 py-2 text-center font-sans text-xs text-muted-strong">
        {ARENA_CHANGE_TEXTS.keys}
      </footer>
    </div>
  );
}
