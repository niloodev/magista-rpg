"use client";

import { ARENA_NAME_MAX_LENGTH } from "@magista/shared";
import Image from "next/image";

import { ARENA_PLACEMENT_TEXTS } from "@/modules/arena/arena.constants";
import { Button, Icon, Input } from "@/shared/components/atoms";
import { FormField, Modal, TokenStyleChoice } from "@/shared/components/molecules";

import { useArenaImageTokenDialog } from "./ArenaImageTokenDialog.hook";
import type { ArenaImageTokenDialogProps } from "./ArenaImageTokenDialog.types";

/**
 * Asked after images from the computer are dropped on the map: the token name (one image) and whether it is a
 * round avatar or an isometric figure.
 */
export function ArenaImageTokenDialog(props: ArenaImageTokenDialogProps) {
  const {
    formId,
    count,
    names,
    previews,
    style,
    formError,
    pending,
    onStyleChange,
    onNameChange,
    submit,
  } = useArenaImageTokenDialog(props);
  const figure = style === "figure";
  return (
    <Modal
      open
      onClose={props.onClose}
      title={ARENA_PLACEMENT_TEXTS.dropTitle(count)}
      description={ARENA_PLACEMENT_TEXTS.dropHelp(count)}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={props.onClose}>
            {ARENA_PLACEMENT_TEXTS.cancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="sm"
            loading={pending}
            data-autofocus
            icon={<Icon name="check" size={14} />}
          >
            {ARENA_PLACEMENT_TEXTS.dropSubmit(count)}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={submit}
        className="grid grid-cols-[minmax(0,1fr)] gap-5"
      >
        <ul className="flex flex-wrap gap-3">
          {previews.map((url, index) => (
            <li
              key={index}
              className={`relative shrink-0 overflow-hidden ${
                count === 1 ? "h-28 w-28" : "h-16 w-16"
              } ${
                figure
                  ? "magista-checker border border-white/10"
                  : "rounded-full bg-void-700 ring-2 ring-primary/50 ring-offset-2 ring-offset-void-900"
              }`}
            >
              {url ? (
                <Image
                  src={url}
                  alt={names[index] ?? ""}
                  fill
                  unoptimized
                  sizes="112px"
                  className={figure ? "object-contain" : "object-cover"}
                />
              ) : (
                <Icon
                  name="image"
                  size={20}
                  aria-hidden
                  className="absolute inset-0 m-auto text-muted-strong"
                />
              )}
            </li>
          ))}
        </ul>
        {count === 1 && (
          <FormField id={`${formId}-name`} label={ARENA_PLACEMENT_TEXTS.npcName}>
            <Input
              id={`${formId}-name`}
              value={names[0] ?? ""}
              maxLength={ARENA_NAME_MAX_LENGTH}
              autoComplete="off"
              onChange={(event) => onNameChange(0, event.target.value)}
            />
          </FormField>
        )}
        <TokenStyleChoice
          id={`${formId}-style`}
          legend={ARENA_PLACEMENT_TEXTS.styleLegend}
          value={style}
          onChange={onStyleChange}
          portraitUrl={previews[0] ?? null}
          figureUrl={previews[0] ?? null}
        />
        {formError && (
          <p
            role="alert"
            className="border-l-2 border-destructive bg-black/40 px-3 py-2 font-sans text-sm text-error"
          >
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}
