export interface TurnInitiativeHexProps {
  value: number | null;
  /** The dice are still rolling: the face spins until they reveal. */
  rolling: boolean;
  current: boolean;
  /** The GM types the value in place (saved on blur or Enter). */
  editable: boolean;
  label: string;
  onCommit: (value: number | null) => void;
}
