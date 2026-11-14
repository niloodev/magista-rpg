import { Icon } from "@/shared/components/atoms";
import { NumberField } from "@/shared/components/molecules/NumberField";

import { STEPPER_BUTTON_TONES, STEPPER_SIZES } from "./Stepper.constants";
import type { StepperProps } from "./Stepper.types";

export function Stepper({
  value,
  onValueChange,
  min,
  max,
  tone = "ruby",
  label,
  size = "sm",
}: StepperProps) {
  const current = value ?? 0;
  const sizes = STEPPER_SIZES[size];
  const buttonClass = `flex shrink-0 cursor-pointer items-center justify-center border bg-black/40 transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 ${sizes.button} ${STEPPER_BUTTON_TONES[tone]}`;
  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        aria-label={`Diminuir ${label}`}
        className={buttonClass}
        disabled={min !== undefined && current <= min}
        onClick={() => onValueChange(current - 1)}
      >
        <Icon name="minus" size={sizes.icon} />
      </button>
      <NumberField
        aria-label={label}
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        compact
        className={`border-transparent bg-transparent px-0 py-0 ${sizes.field} ${tone === "teal" ? "text-teal-200" : "text-foreground"}`}
      />
      <button
        type="button"
        aria-label={`Aumentar ${label}`}
        className={buttonClass}
        disabled={max !== undefined && current >= max}
        onClick={() => onValueChange(current + 1)}
      >
        <Icon name="plus" size={sizes.icon} />
      </button>
    </div>
  );
}
