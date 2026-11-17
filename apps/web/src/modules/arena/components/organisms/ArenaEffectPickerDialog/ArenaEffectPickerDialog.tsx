"use client";

import {
  ARENA_EFFECT_CATALOG,
  ARENA_EFFECT_FILTERS,
  ARENA_EFFECT_TAG_LABELS,
  ARENA_EFFECT_TEXTS,
} from "@/modules/arena/arena.constants";
import { Button, Checkbox, Icon, Input } from "@/shared/components/atoms";
import { Modal } from "@/shared/components/molecules";

import { ArenaEffectPreviewCanvas } from "../../molecules";
import {
  AUTO_ACCENT,
  CHOICE_CLASS,
  FILTER_CLASS,
  TAG_CLASS,
  ULTIMATE_TAG_CLASS,
} from "./ArenaEffectPickerDialog.constants";
import { useArenaEffectPickerDialog } from "./ArenaEffectPickerDialog.hook";
import type { ArenaEffectPickerDialogProps } from "./ArenaEffectPickerDialog.types";

/**
 * The effect library: search and filters on top, "Automático" pinned first and the effects in a scrolling list
 * (made for a catalog that keeps growing), with a live example of the highlighted one beside it (with or without
 * the attacker's part). "Usar efeito" keeps it for the next changes.
 */
export function ArenaEffectPickerDialog({
  kind,
  resource,
  value,
  autoStyle,
  onChoose,
  onClose,
}: ArenaEffectPickerDialogProps) {
  const {
    groupId,
    lite,
    draft,
    setDraft,
    withAttacker,
    setWithAttacker,
    query,
    setQuery,
    filter,
    setFilter,
    shown,
    countLabel,
    autoDetail,
    play,
    previewName,
    previewDetail,
    previewLabel,
    confirm,
  } = useArenaEffectPickerDialog({ kind, resource, value, autoStyle, onChoose });
  return (
    <Modal
      open
      onClose={onClose}
      title={ARENA_EFFECT_TEXTS.title}
      description={ARENA_EFFECT_TEXTS.description}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {ARENA_EFFECT_TEXTS.cancel}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={confirm}
            icon={<Icon name="check" size={14} />}
          >
            {ARENA_EFFECT_TEXTS.use}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 content-start gap-3">
          <Input
            type="search"
            aria-label={ARENA_EFFECT_TEXTS.search}
            placeholder={ARENA_EFFECT_TEXTS.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <fieldset className="flex flex-wrap gap-1.5">
            <legend className="sr-only">{ARENA_EFFECT_TEXTS.filters}</legend>
            {ARENA_EFFECT_FILTERS.map((option) => (
              <label key={option.value} className={FILTER_CLASS}>
                <input
                  type="radio"
                  name={`${groupId}-filter`}
                  value={option.value}
                  checked={filter === option.value}
                  onChange={() => setFilter(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="sr-only">{ARENA_EFFECT_TEXTS.title}</legend>
            <label className={CHOICE_CLASS}>
              <input
                type="radio"
                name={groupId}
                value="auto"
                checked={draft === "auto"}
                onChange={() => setDraft("auto")}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-1.5 size-2.5 shrink-0 rotate-45 ${AUTO_ACCENT}`}
              />
              <span className="grid min-w-0 gap-0.5">
                <span className="flex items-center gap-2 font-serif text-base text-label group-has-checked/choice:text-gold-300">
                  <Icon name="wand-sparkles" size={14} />
                  {ARENA_EFFECT_TEXTS.auto}
                </span>
                <span className="font-sans text-sm text-muted-strong">{autoDetail}</span>
              </span>
            </label>
            <div className="flex items-center gap-3 pt-1">
              <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
              <span aria-live="polite" className="font-sans text-xs text-muted-strong">
                {countLabel}
              </span>
              <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
            </div>
            <div className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
              {shown.length === 0 && (
                <p className="py-6 text-center font-sans text-sm text-muted-strong">
                  {ARENA_EFFECT_TEXTS.empty}
                </p>
              )}
              {shown.map((style) => {
                const entry = ARENA_EFFECT_CATALOG[style];
                return (
                  <label key={style} className={CHOICE_CLASS}>
                    <input
                      type="radio"
                      name={groupId}
                      value={style}
                      checked={draft === style}
                      onChange={() => setDraft(style)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 size-2.5 shrink-0 rotate-45 ${entry.accent}`}
                    />
                    <span className="grid min-w-0 flex-1 gap-1">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-serif text-base text-label group-has-checked/choice:text-gold-300">
                          {entry.name}
                        </span>
                        <span className="flex gap-1">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className={tag === "ultimate" ? ULTIMATE_TAG_CLASS : TAG_CLASS}
                            >
                              {ARENA_EFFECT_TAG_LABELS[tag]}
                            </span>
                          ))}
                        </span>
                      </span>
                      <span className="font-sans text-sm text-muted-strong">
                        {entry.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
        <div className="grid content-start gap-3 md:sticky md:top-0">
          <ArenaEffectPreviewCanvas play={play} label={previewLabel} className="h-56 w-full" />
          <div className="grid gap-1">
            <p className="font-serif text-lg text-gold-300">{previewName}</p>
            <p className="font-sans text-sm text-muted-strong">{previewDetail}</p>
          </div>
          <Checkbox
            tone="ruby"
            checked={withAttacker && !lite}
            onCheckedChange={setWithAttacker}
            label={ARENA_EFFECT_TEXTS.withAttacker}
            disabled={lite}
            aria-describedby={lite ? `${groupId}-lite` : undefined}
            className="min-h-11"
          />
          {lite && (
            <p id={`${groupId}-lite`} className="font-sans text-xs text-muted-strong">
              {ARENA_EFFECT_TEXTS.withAttackerLite}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
