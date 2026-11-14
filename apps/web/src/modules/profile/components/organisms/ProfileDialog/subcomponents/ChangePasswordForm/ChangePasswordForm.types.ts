import type { PASSWORD_FIELDS } from "./ChangePasswordForm.constants";

export type PasswordField = (typeof PASSWORD_FIELDS)[number];

export type PasswordValues = Record<PasswordField, string>;

export type PasswordErrors = Partial<Record<PasswordField, string>>;

export interface ChangePasswordFormProps {
  onChanged: () => void;
}
