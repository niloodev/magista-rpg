"use client";

import { useId, useState, type FormEvent } from "react";

import { changePassword } from "@/modules/profile/services";

import { EMPTY_PASSWORD_VALUES } from "./ChangePasswordForm.constants";
import type {
  ChangePasswordFormProps,
  PasswordErrors,
  PasswordField,
  PasswordValues,
} from "./ChangePasswordForm.types";
import { firstInvalidField, validatePasswordChange } from "./ChangePasswordForm.utils";

/**
 * Change password form: validates locally, sends to the API and reports success; server errors (wrong current
 * password, too many tries) show above the button and send the focus back to the current password.
 */
export function useChangePasswordForm({ onChanged }: ChangePasswordFormProps) {
  const formId = useId();
  const [values, setValues] = useState<PasswordValues>(EMPTY_PASSWORD_VALUES);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [changed, setChanged] = useState(false);

  const fieldId = (field: PasswordField) => `${formId}-${field}`;
  const focusField = (field: PasswordField) => document.getElementById(fieldId(field))?.focus();

  const onChange = (field: PasswordField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setChanged(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const found = validatePasswordChange(values);
    const invalid = firstInvalidField(found);
    setErrors(found);
    setServerError(null);
    if (invalid) {
      focusField(invalid);
      return;
    }
    setPending(true);
    const result = await changePassword({
      currentPassword: values.current,
      newPassword: values.next,
    });
    setPending(false);
    if ("error" in result) {
      setServerError(result.error);
      focusField("current");
      return;
    }
    setValues(EMPTY_PASSWORD_VALUES);
    setChanged(true);
    onChanged();
  };

  return { formId, values, errors, serverError, pending, changed, fieldId, onChange, submit };
}
