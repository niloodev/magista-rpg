import { formatSigned } from "@/modules/sheet/sheet.utils";
import { Checkbox, Icon } from "@/shared/components/atoms";

import type { SkillRowProps } from "./SkillRow.types";

export function SkillRow({
  name,
  attribute,
  value,
  proficient,
  onProficientChange,
  onRoll,
}: SkillRowProps) {
  return (
    <li className="group flex items-center gap-3 border-b border-white/5 last:border-b-0">
      <Checkbox
        checked={proficient}
        onCheckedChange={onProficientChange}
        aria-label={`Proficiente em ${name}`}
        className="pl-1"
      />
      <button
        type="button"
        onClick={onRoll}
        className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 px-2 text-left transition-colors hover:bg-white/5"
      >
        <span
          className={`font-sans text-[15px] ${proficient ? "font-semibold text-foreground" : "text-foreground/85"}`}
        >
          {name}
        </span>
        <span className="font-sans text-xs font-semibold tracking-wider text-muted-strong uppercase">
          {attribute}
        </span>
        <span className="ml-auto min-w-10 text-right font-serif text-xl text-foreground">
          {formatSigned(value)}
        </span>
        <Icon
          name="dices"
          size={18}
          className="text-accent-text/70 transition-all duration-300 group-hover:rotate-12 group-hover:text-accent-text"
        />
        <span className="sr-only">Rolar teste de {name}</span>
      </button>
    </li>
  );
}
