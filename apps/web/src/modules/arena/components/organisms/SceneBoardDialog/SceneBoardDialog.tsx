"use client";

import { SCENE_TEXTS } from "@/modules/arena/arena.constants";
import { Button, Icon, Input } from "@/shared/components/atoms";
import { FormField, Modal } from "@/shared/components/molecules";

import { useSceneBoardDialog } from "./SceneBoardDialog.hook";
import type { SceneBoardDialogProps } from "./SceneBoardDialog.types";

export function SceneBoardDialog({ scene, onSubmit, onClose }: SceneBoardDialogProps) {
  const {
    formId,
    widthRef,
    heightRef,
    describedBy,
    draft,
    error,
    pending,
    locked,
    pixels,
    mapSize,
    onWidthChange,
    onHeightChange,
    resetToOriginal,
    submit,
  } = useSceneBoardDialog({ scene, onSubmit });
  return (
    <Modal
      open
      onClose={onClose}
      title={SCENE_TEXTS.board}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {SCENE_TEXTS.cancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="sm"
            loading={pending}
            icon={<Icon name="check" size={14} />}
          >
            {SCENE_TEXTS.save}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="grid gap-4">
        <p className="font-serif text-base tracking-wide text-label">{scene.name}</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <FormField
            id={`${formId}-width`}
            label={`${SCENE_TEXTS.boardWidth} (${SCENE_TEXTS.boardUnit})`}
          >
            <Input
              id={`${formId}-width`}
              ref={widthRef}
              inputMode="decimal"
              autoComplete="off"
              value={draft.width}
              invalid={Boolean(error)}
              aria-describedby={describedBy}
              onChange={(event) => onWidthChange(event.target.value)}
            />
          </FormField>
          <span className="flex h-11 w-8 items-center justify-center text-muted-strong" aria-hidden>
            <Icon name={locked ? "link-2" : "x"} size={16} />
          </span>
          <FormField
            id={`${formId}-height`}
            label={`${SCENE_TEXTS.boardHeight} (${SCENE_TEXTS.boardUnit})`}
          >
            <Input
              id={`${formId}-height`}
              ref={heightRef}
              inputMode="decimal"
              autoComplete="off"
              value={draft.height}
              invalid={Boolean(error)}
              aria-describedby={describedBy}
              onChange={(event) => onHeightChange(event.target.value)}
            />
          </FormField>
        </div>
        <div id={`${formId}-pixels`} className="grid gap-1 font-sans text-[13px] text-muted-strong">
          {locked && (
            <p className="flex items-center gap-1.5 text-teal-400">
              <Icon name="link-2" size={14} />
              {SCENE_TEXTS.boardRatio}
            </p>
          )}
          {pixels && <p className="tabular-nums">{pixels}</p>}
          {mapSize && <p className="tabular-nums">{mapSize}</p>}
        </div>
        {error && (
          <p
            id={`${formId}-error`}
            role="alert"
            className="font-sans text-[13px] font-semibold text-error"
          >
            {error}
          </p>
        )}
        <p className="font-sans text-sm text-muted-strong">{SCENE_TEXTS.boardTokens}</p>
        {locked && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-self-start"
            icon={<Icon name="image" size={14} />}
            onClick={resetToOriginal}
          >
            {SCENE_TEXTS.boardOriginal}
          </Button>
        )}
      </form>
    </Modal>
  );
}
