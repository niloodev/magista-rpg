export interface ArenaSelectionBarProps {
  label: string;
  isGm: boolean;
  size: number | null;
  allHidden: boolean;
  canOpenSheet: boolean;
  onSizeChange: (size: number | null) => void;
  onToggleHidden: () => void;
  onOpenSheet: () => void;
  onRemove: () => void;
  className?: string;
}
