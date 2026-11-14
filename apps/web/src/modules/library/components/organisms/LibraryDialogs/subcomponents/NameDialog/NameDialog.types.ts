import type { SelectOption } from "@/shared/components/atoms";

export interface INameDialogValues {
  name: string;
  folderId: string | null;
}

export interface NameDialogProps {
  title: string;
  label: string;
  submitLabel: string;
  initialName: string;
  maxLength: number;
  folderOptions?: SelectOption[];
  initialFolderId?: string | null;
  onSubmit: (values: INameDialogValues) => Promise<string | null>;
  onClose: () => void;
}
