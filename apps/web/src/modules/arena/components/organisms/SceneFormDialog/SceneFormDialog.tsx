"use client";

import { SCENE_TEXTS } from "@/modules/arena/arena.constants";
import { Button, Icon, Input } from "@/shared/components/atoms";
import { FormField, ImageField, Modal } from "@/shared/components/molecules";

import { useSceneFormDialog } from "./SceneFormDialog.hook";
import type { SceneFormDialogProps } from "./SceneFormDialog.types";

export function SceneFormDialog({
  title,
  submitLabel,
  nameLabel,
  initialName,
  withMap,
  mapRequired,
  currentMapUrl = null,
  onSubmit,
  onClose,
}: SceneFormDialogProps) {
  const { formId, name, file, nameError, mapError, pending, onNameChange, onFileChange, submit } =
    useSceneFormDialog({ nameLabel, initialName, mapRequired, onSubmit });
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      size={withMap ? "md" : "sm"}
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
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="grid gap-5">
        {nameLabel !== null && (
          <FormField id={`${formId}-name`} label={nameLabel} error={nameError ?? undefined}>
            <Input
              id={`${formId}-name`}
              value={name}
              maxLength={60}
              autoComplete="off"
              invalid={Boolean(nameError)}
              onChange={(event) => onNameChange(event.target.value)}
            />
          </FormField>
        )}
        {withMap && (
          <ImageField
            id={`${formId}-map`}
            label={SCENE_TEXTS.map}
            hint={SCENE_TEXTS.mapHint}
            shape="landscape"
            file={file}
            currentUrl={currentMapUrl}
            error={mapError}
            onFileChange={onFileChange}
            onRemoveCurrent={() => onFileChange(null)}
          />
        )}
      </form>
    </Modal>
  );
}
