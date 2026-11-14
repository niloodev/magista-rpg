import { Icon } from "@/shared/components/atoms/Icon";
import { CHECKBOX_TONES } from "./Checkbox.constants";
import type { CheckboxProps } from "./Checkbox.types";

export function Checkbox({
  checked,
  onCheckedChange,
  tone = "ruby",
  label,
  className,
  ...props
}: CheckboxProps) {
  return (
    <label
      className={`group inline-flex min-h-8 cursor-pointer items-center gap-2 ${className ?? ""}`}
    >
      <span className="relative inline-flex h-5 w-5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
          {...props}
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none flex h-5 w-5 items-center justify-center border bg-black/50 text-white transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-text ${CHECKBOX_TONES[tone]}`}
        >
          {checked && <Icon name="check" size={14} strokeWidth={3} />}
        </span>
      </span>
      {label && (
        <span className="font-sans text-xs font-semibold tracking-wider text-muted-strong uppercase transition-colors group-hover:text-foreground">
          {label}
        </span>
      )}
    </label>
  );
}
