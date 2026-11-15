import type { SelectOption } from "@/shared/components/atoms";

export interface INameDialogImages {
  avatar: File | null;
  art: File | null;
}

export interface INameDialogValues {
  name: string;
  folderId: string | null;
  images: INameDialogImages;
}

export interface NameDialogProps {
  title: string;
  label: string;
  submitLabel: string;
  initialName: string;
  maxLength: number;
  folderOptions?: SelectOption[];
  initialFolderId?: string | null;
  /** Shows the optional AVATAR and ART fields (creating a character). */
  withImages?: boolean;
  onSubmit: (values: INameDialogValues) => Promise<string | null>;
  onClose: () => void;
}
