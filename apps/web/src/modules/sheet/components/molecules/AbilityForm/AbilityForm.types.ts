import type { ISheetAbility } from "@magista/shared";

export interface AbilityFormProps {
  formId: string;
  value: ISheetAbility;
  errors: Partial<Record<keyof ISheetAbility, string>>;
  onChange: (patch: Partial<ISheetAbility>) => void;
  onSubmit: () => void;
}
