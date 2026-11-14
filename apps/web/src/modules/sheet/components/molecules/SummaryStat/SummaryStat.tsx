import type { SummaryStatProps } from "./SummaryStat.types";

export function SummaryStat({ label, value, title }: SummaryStatProps) {
  return (
    <div
      title={title}
      className="flex min-w-14 flex-col items-center border border-white/10 bg-black/40 px-3 py-1.5"
    >
      <span className="font-sans text-[11px] font-bold tracking-wider text-accent-text uppercase">
        {label}
      </span>
      <span className="font-serif text-xl leading-tight text-foreground">{value}</span>
      <span className="sr-only">{title}</span>
    </div>
  );
}
