import type { IDerivedAttribute } from "@magista/shared";

export interface AttributeCardProps {
  label: string;
  name: string;
  value: number | null;
  proficient: boolean;
  derived: IDerivedAttribute;
  onValueChange: (value: number | null) => void;
  onProficientChange: (proficient: boolean) => void;
  onRoll: () => void;
}
