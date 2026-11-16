import type { IArenaTokenStatus } from "@magista/shared";

export interface ArenaSelectionBarProps {
  label: string;
  isGm: boolean;
  size: number | null;
  /** Status of the single selected token, when visible, with its text for screen readers. */
  status: { status: IArenaTokenStatus; label: string } | null;
  onSizeChange: (size: number | null) => void;
  className?: string;
}
