import type { IMarkedShare } from "@magista/shared";

export interface SharedTraitEntryProps {
  share: IMarkedShare;
  canStop: boolean;
  onStop: () => void;
}
