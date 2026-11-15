"use client";

import { UNNAMED_TRAIT } from "@/modules/marked/marked.constants";
import { Button, Icon, Text } from "@/shared/components/atoms";
import { ExpandableText, Modal } from "@/shared/components/molecules";

import { SHARE_DIALOG_TEXTS, SHARE_FORM_ID } from "./MarkedShareDialog.constants";
import { useMarkedShareDialog } from "./MarkedShareDialog.hook";
import type { MarkedShareDialogProps } from "./MarkedShareDialog.types";

export function MarkedShareDialog(props: MarkedShareDialogProps) {
  const { open, traits, loading, error, onClose } = props;
  const { selectedId, selected, choose, submit } = useMarkedShareDialog(props);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={SHARE_DIALOG_TEXTS.title}
      description={SHARE_DIALOG_TEXTS.description}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {SHARE_DIALOG_TEXTS.cancel}
          </Button>
          <Button
            type="submit"
            form={SHARE_FORM_ID}
            variant="mystic"
            size="sm"
            loading={loading}
            loadingLabel={SHARE_DIALOG_TEXTS.sending}
            disabled={!selectedId}
            icon={<Icon name="sparkles" size={14} />}
          >
            {SHARE_DIALOG_TEXTS.submit}
          </Button>
        </>
      }
    >
      <form id={SHARE_FORM_ID} onSubmit={submit} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-sans text-xs font-semibold tracking-[0.12em] text-label uppercase">
            {SHARE_DIALOG_TEXTS.legend}
          </legend>
          {traits.map((trait, index) => (
            <label
              key={trait.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 border border-white/10 bg-black/30 px-4 py-2 transition-colors hover:border-primary/40 has-[:checked]:border-gold-400/60 has-[:checked]:bg-primary/10"
            >
              <input
                type="radio"
                name="marked-trait"
                value={trait.id}
                checked={selectedId === trait.id}
                onChange={() => choose(trait.id)}
                data-autofocus={index === 0 ? "" : undefined}
                className="h-4 w-4 accent-[var(--magista-gold-400)]"
              />
              <span className="font-serif text-base text-foreground">
                {trait.name || UNNAMED_TRAIT}
              </span>
            </label>
          ))}
        </fieldset>
        {selected?.description && (
          <div className="border border-white/10 bg-black/40 p-4">
            <ExpandableText text={selected.description} />
          </div>
        )}
        {error && (
          <Text variant="body" role="alert" className="text-error">
            {error}
          </Text>
        )}
      </form>
    </Modal>
  );
}
