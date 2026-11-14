export interface OpeningActionProps {
  name: string;
  effect: string;
  cost: number;
  rolls: boolean;
  available: boolean;
  onSpend: () => void;
}
