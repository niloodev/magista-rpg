import type { IconName } from "@/shared/components/atoms";

export interface BlockCardProps {
  icon: IconName;
  name: string;
  attribute: string;
  summary: string;
  expression: string;
  outcomes: string[];
  onRoll: () => void;
}
