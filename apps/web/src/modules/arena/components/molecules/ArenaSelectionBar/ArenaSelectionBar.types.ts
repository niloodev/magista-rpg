import type { IArenaTokenStatus } from "@magista/shared";

export interface ArenaSelectionBarProps {
  label: string;
  isGm: boolean;
  size: number | null;
  allHidden: boolean;
  canOpenSheet: boolean;
  /** Status of the single selected token, when visible, with its text for screen readers. */
  status: { status: IArenaTokenStatus; label: string } | null;
  /** The GM may open the settings of the single selected token. */
  canConfigure: boolean;
  onConfigure: () => void;
  onSizeChange: (size: number | null) => void;
  onToggleHidden: () => void;
  onOpenSheet: () => void;
  onRemove: () => void;
  className?: string;
}
