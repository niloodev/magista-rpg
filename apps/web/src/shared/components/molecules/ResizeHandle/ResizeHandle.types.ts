export interface ResizeHandleProps {
  label: string;
  value: number;
  min: number;
  max: number;
  /** 1 when dragging right makes the panel wider (handle on its right edge), -1 for the opposite. */
  direction: 1 | -1;
  onChange: (value: number) => void;
  /** Called once the drag or key press ends, with the final value (to save it). */
  onCommit: (value: number) => void;
  className?: string;
}
