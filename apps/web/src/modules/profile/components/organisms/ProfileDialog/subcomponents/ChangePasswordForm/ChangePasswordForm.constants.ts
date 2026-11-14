import { ACCOUNT_PASSWORD_MIN_LENGTH } from "@magista/shared";

import type { PasswordValues } from "./ChangePasswordForm.types";

export const PASSWORD_FIELD_ERRORS = {
  currentRequired: "Digite a senha atual.",
  nextTooShort: `A nova senha precisa ter pelo menos ${ACCOUNT_PASSWORD_MIN_LENGTH} caracteres.`,
  nextUnchanged: "A nova senha precisa ser diferente da atual.",
  confirmMismatch: "A confirmação não bate com a nova senha.",
} as const;

export const PASSWORD_CHANGED_MESSAGE =
  "Senha alterada. As outras sessões desta conta foram encerradas.";

export const PASSWORD_FIELDS = ["current", "next", "confirm"] as const;

export const NEXT_PASSWORD_HINT = `Mínimo de ${ACCOUNT_PASSWORD_MIN_LENGTH} caracteres.`;

export const EMPTY_PASSWORD_VALUES: PasswordValues = { current: "", next: "", confirm: "" };

export const PASSWORD_FORM_COPY = {
  title: "Trocar senha",
  current: "Senha atual",
  next: "Nova senha",
  confirm: "Confirmar nova senha",
  submit: "Salvar nova senha",
} as const;
