import type { ISheetInventoryItem } from "@magista/shared";

export interface ItemFormProps {
  formId: string;
  value: ISheetInventoryItem;
  errors: Partial<Record<keyof ISheetInventoryItem, string>>;
  onChange: (patch: Partial<ISheetInventoryItem>) => void;
  onSubmit: () => void;
}
