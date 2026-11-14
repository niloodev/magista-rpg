import { Icon } from "@/shared/components/atoms";

import type { BlockCardProps } from "./BlockCard.types";

export function BlockCard({
  icon,
  name,
  attribute,
  summary,
  expression,
  outcomes,
  onRoll,
}: BlockCardProps) {
  return (
    <div className="group flex flex-col border border-primary/35 bg-black/40 transition-all duration-300 hover:border-primary/70 hover:shadow-[0_0_18px_rgba(228,42,99,0.18)]">
      <button
        type="button"
        onClick={onRoll}
        className="flex cursor-pointer items-center gap-3 border-b border-white/10 p-4 text-left transition-colors hover:bg-primary/10 active:scale-[0.99]"
      >
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center border border-primary/50 bg-primary/10 text-accent-text"
        >
          <Icon name={icon} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-sans text-sm font-bold tracking-wider text-foreground uppercase">
            {name}
          </span>
          <span className="block font-sans text-sm text-muted-strong">
            {attribute} · {summary}
          </span>
        </span>
        <span className="flex flex-col items-end">
          <span className="font-sans text-xl font-semibold whitespace-nowrap text-foreground">
            {expression}
          </span>
          <span className="flex items-center gap-1 font-sans text-xs font-semibold text-accent-text uppercase">
            <Icon
              name="dices"
              size={14}
              className="transition-transform duration-500 group-hover:rotate-180"
            />{" "}
            Rolar
          </span>
        </span>
      </button>
      <ul className="space-y-1.5 p-4">
        {outcomes.map((outcome) => (
          <li key={outcome} className="font-sans text-[13px] leading-snug text-muted-strong">
            {outcome}
          </li>
        ))}
      </ul>
    </div>
  );
}
