"use client";

import { SPECIAL_FEATURES } from "@magista/shared";

import { Button, Checkbox, Icon } from "@/shared/components/atoms";
import { Modal } from "@/shared/components/molecules";

import { useFeaturesDialog } from "./FeaturesDialog.hook";
import type { FeaturesDialogProps } from "./FeaturesDialog.types";

export function FeaturesDialog({
  characterName,
  initialFeatures,
  onSubmit,
  onClose,
}: FeaturesDialogProps) {
  const { formId, keys, columns, selected, toggle, error, pending, submit } = useFeaturesDialog({
    initialFeatures,
    onSubmit,
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={`Tags especiais de ${characterName}`}
      description="Cada tag liga mecânicas e seções exclusivas na ficha."
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="sm"
            loading={pending}
            icon={<Icon name="check" size={14} />}
          >
            Salvar tags
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="grid gap-3">
        <fieldset className={`grid gap-3 ${columns}`}>
          <legend className="sr-only">Tags especiais</legend>
          {keys.map((key) => (
            <div key={key} className="border border-white/10 bg-black/30 px-4 py-3">
              <Checkbox
                checked={selected.includes(key)}
                onCheckedChange={(checked) => toggle(key, checked)}
                label={SPECIAL_FEATURES[key].label}
                className="min-h-11 w-full"
              />
              <p className="mt-1 font-sans text-sm text-muted-strong">
                {SPECIAL_FEATURES[key].description}
              </p>
            </div>
          ))}
        </fieldset>
        {error && (
          <p role="alert" className="font-sans text-sm font-semibold text-error">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
