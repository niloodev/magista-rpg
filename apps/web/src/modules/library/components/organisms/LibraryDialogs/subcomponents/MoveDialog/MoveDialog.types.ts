import type { SelectOption } from "@/shared/components/atoms";

export interface MoveDialogProps {
  itemName: string;
  currentParentId: string | null;
  options: SelectOption[];
  onSubmit: (parentId: string | null) => Promise<string | null>;
  onClose: () => void;
}
