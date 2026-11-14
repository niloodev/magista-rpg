export interface SkillRowProps {
  name: string;
  attribute: string;
  value: number;
  proficient: boolean;
  onProficientChange: (proficient: boolean) => void;
  onRoll: () => void;
}
