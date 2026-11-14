import type { ICharacterSheet } from "@magista/shared";

export type IdentityDraft = ICharacterSheet["identity"];

export interface IdentityFormProps {
  formId: string;
  value: IdentityDraft;
  gmFieldsLocked: boolean;
  onChange: (patch: Partial<IdentityDraft>) => void;
  onSubmit: () => void;
}
