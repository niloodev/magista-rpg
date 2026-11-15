import type { ISheetTrait } from "@magista/shared";

export interface MarkedShareDialogProps {
  open: boolean;
  traits: ISheetTrait[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (traitId: string) => void;
}

export type MarkedShareDialogHookProps = Pick<
  MarkedShareDialogProps,
  "open" | "traits" | "onSubmit"
>;
