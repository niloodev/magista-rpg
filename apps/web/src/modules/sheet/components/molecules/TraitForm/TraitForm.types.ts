import type { ISheetTrait } from "@magista/shared";

export interface TraitFormProps {
  formId: string;
  value: ISheetTrait;
  errors: Partial<Record<keyof ISheetTrait, string>>;
  onChange: (patch: Partial<ISheetTrait>) => void;
  onSubmit: () => void;
}
