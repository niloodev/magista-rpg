"use client";

import dynamic from "next/dynamic";

import { Button, Icon } from "@/shared/components/atoms";
import { Modal } from "@/shared/components/molecules";

import { SHEET_EFFECTS_TEXTS } from "./SheetEffectsDialog.constants";
import { useSheetEffectsDialog } from "./SheetEffectsDialog.hook";
import type { SheetEffectsDialogProps } from "./SheetEffectsDialog.types";

const ArenaEffectPickerDialog = dynamic(() =>
  import("@/modules/arena/components/organisms/ArenaEffectPickerDialog").then(
    (module) => module.ArenaEffectPickerDialog,
  ),
);

/**
 * "Animações" of a sheet: the effect it plays in "Aplicar mudança" for each action and attribute when it
 * attacks with the effect on "Automático", each picked in the effect picker with its live example.
 */
export function SheetEffectsDialog(props: SheetEffectsDialogProps) {
  const { formId, rows, picking, pickingValue, openPicker, closePicker, choose, submit } =
    useSheetEffectsDialog(props);
  return (
    <>
      <Modal
        open
        onClose={props.onClose}
        title={SHEET_EFFECTS_TEXTS.title}
        description={SHEET_EFFECTS_TEXTS.description(props.characterName)}
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={props.onClose}>
              {SHEET_EFFECTS_TEXTS.cancel}
            </Button>
            <Button
              type="submit"
              form={formId}
              variant="primary"
              size="sm"
              icon={<Icon name="check" size={14} />}
            >
              {SHEET_EFFECTS_TEXTS.save}
            </Button>
          </>
        }
      >
        <form id={formId} noValidate onSubmit={submit} className="grid gap-3">
          <p className="font-sans text-[15px] text-muted-strong">{SHEET_EFFECTS_TEXTS.help}</p>
          <ul className="grid gap-2">
            {rows.map(({ slot, chosen, name, accent }, index) => (
              <li
                key={`${slot.kind}-${slot.resource}`}
                className="flex min-h-14 items-center gap-3 border border-white/10 bg-black/30 px-4 py-2"
              >
                <span aria-hidden="true" className={`h-3 w-3 shrink-0 rotate-45 ${accent}`} />
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="font-sans text-xs font-semibold tracking-[0.12em] text-label uppercase">
                    {slot.label}
                  </span>
                  <span
                    className={`font-serif text-[15px] tracking-wide break-words ${
                      chosen ? "text-gold-300" : "text-foreground"
                    }`}
                  >
                    {name}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openPicker(slot)}
                  aria-label={SHEET_EFFECTS_TEXTS.change(slot.label)}
                  data-autofocus={index === 0 ? true : undefined}
                  icon={<Icon name="wand-sparkles" size={14} />}
                >
                  <span className="max-sm:sr-only">{SHEET_EFFECTS_TEXTS.changeShort}</span>
                </Button>
              </li>
            ))}
          </ul>
        </form>
      </Modal>
      {picking && (
        <ArenaEffectPickerDialog
          kind={picking.kind}
          resource={picking.resource}
          value={pickingValue}
          onChoose={choose}
          onClose={closePicker}
        />
      )}
    </>
  );
}
