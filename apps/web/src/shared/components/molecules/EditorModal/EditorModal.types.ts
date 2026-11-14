import type { ReactNode } from "react";

import type { ModalSize } from "@/shared/components/molecules/Modal";

export interface EditorModalProps {
  open: boolean;
  mode: "create" | "edit" | null;
  entityLabel: string;
  formId: string;
  size?: ModalSize;
  onClose: () => void;
  onDelete?: () => void;
  children: ReactNode;
}
