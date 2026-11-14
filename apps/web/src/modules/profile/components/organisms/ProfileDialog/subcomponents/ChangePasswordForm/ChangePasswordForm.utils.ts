import { ACCOUNT_PASSWORD_MIN_LENGTH } from "@magista/shared";

import { PASSWORD_FIELD_ERRORS, PASSWORD_FIELDS } from "./ChangePasswordForm.constants";
import type { PasswordErrors, PasswordField, PasswordValues } from "./ChangePasswordForm.types";

/**
 * Checks the change password form before calling the API (same rules as the server schema, plus the confirmation).
 */
export function validatePasswordChange(values: PasswordValues): PasswordErrors {
  const errors: PasswordErrors = {};
  if (!values.current) errors.current = PASSWORD_FIELD_ERRORS.currentRequired;
  if (values.next.length < ACCOUNT_PASSWORD_MIN_LENGTH)
    errors.next = PASSWORD_FIELD_ERRORS.nextTooShort;
  else if (values.next === values.current) errors.next = PASSWORD_FIELD_ERRORS.nextUnchanged;
  if (values.confirm !== values.next) errors.confirm = PASSWORD_FIELD_ERRORS.confirmMismatch;
  return errors;
}

/**
 * First field with an error, in screen order (to move the focus there).
 */
export function firstInvalidField(errors: PasswordErrors): PasswordField | null {
  return PASSWORD_FIELDS.find((field) => errors[field]) ?? null;
}
