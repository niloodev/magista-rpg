import { Icon } from "@/shared/components/atoms";

import { ROLL_BAR_TONES } from "./RollBar.constants";
import type { RollBarProps } from "./RollBar.types";

export function RollBar({ label, expression, tone = "ruby", onRoll }: RollBarProps) {
  const styles = ROLL_BAR_TONES[tone];
  return (
    <button
      type="button"
      onClick={onRoll}
      className={`group relative flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 overflow-hidden border bg-black/40 py-2 pr-3 pl-5 text-left transition-all duration-300 hover:bg-black/60 active:scale-[0.98] ${styles.box}`}
    >
      <span
        className={`absolute top-0 left-0 h-full w-1 transition-colors duration-300 ${styles.bar}`}
      />
      <span className="flex min-w-0 flex-col">
        <span className={`font-sans text-xs font-bold tracking-wider uppercase ${styles.label}`}>
          {label}
        </span>
        <span className={`truncate font-sans text-lg ${styles.value}`}>{expression}</span>
      </span>
      <Icon
        name="dices"
        size={20}
        className={`shrink-0 transition-transform duration-500 group-hover:rotate-180 ${styles.label}`}
      />
      <span className="sr-only">Rolar {label}</span>
    </button>
  );
}
