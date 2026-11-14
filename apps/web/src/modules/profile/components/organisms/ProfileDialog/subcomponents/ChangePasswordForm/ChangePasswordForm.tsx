"use client";

import { Button, Icon } from "@/shared/components/atoms";
import { FormField, PasswordField } from "@/shared/components/molecules";

import {
  NEXT_PASSWORD_HINT,
  PASSWORD_CHANGED_MESSAGE,
  PASSWORD_FORM_COPY,
} from "./ChangePasswordForm.constants";
import { useChangePasswordForm } from "./ChangePasswordForm.hook";
import type { ChangePasswordFormProps } from "./ChangePasswordForm.types";

export function ChangePasswordForm(props: ChangePasswordFormProps) {
  const { formId, values, errors, serverError, pending, changed, fieldId, onChange, submit } =
    useChangePasswordForm(props);
  return (
    <form noValidate onSubmit={submit} aria-labelledby={`${formId}-title`} className="grid gap-4">
      <h3
        id={`${formId}-title`}
        className="font-serif text-sm tracking-[0.15em] text-accent-text uppercase"
      >
        {PASSWORD_FORM_COPY.title}
      </h3>
      <FormField id={fieldId("current")} label={PASSWORD_FORM_COPY.current} error={errors.current}>
        <PasswordField
          id={fieldId("current")}
          value={values.current}
          autoComplete="current-password"
          invalid={Boolean(errors.current)}
          onChange={(event) => onChange("current", event.target.value)}
        />
      </FormField>
      <FormField
        id={fieldId("next")}
        label={PASSWORD_FORM_COPY.next}
        hint={NEXT_PASSWORD_HINT}
        error={errors.next}
      >
        <PasswordField
          id={fieldId("next")}
          value={values.next}
          autoComplete="new-password"
          invalid={Boolean(errors.next)}
          onChange={(event) => onChange("next", event.target.value)}
        />
      </FormField>
      <FormField id={fieldId("confirm")} label={PASSWORD_FORM_COPY.confirm} error={errors.confirm}>
        <PasswordField
          id={fieldId("confirm")}
          value={values.confirm}
          autoComplete="new-password"
          invalid={Boolean(errors.confirm)}
          onChange={(event) => onChange("confirm", event.target.value)}
        />
      </FormField>
      {serverError && (
        <p role="alert" className="font-sans text-[15px] text-error">
          {serverError}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={pending}
          icon={<Icon name="key-round" size={14} />}
        >
          {PASSWORD_FORM_COPY.submit}
        </Button>
        <p role="status" className="font-sans text-[15px] text-teal-300">
          {changed ? PASSWORD_CHANGED_MESSAGE : ""}
        </p>
      </div>
    </form>
  );
}
