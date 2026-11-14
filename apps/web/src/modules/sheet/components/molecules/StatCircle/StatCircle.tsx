import type { StatCircleProps } from "./StatCircle.types";

export function StatCircle({ label, value, title }: StatCircleProps) {
  return (
    <div title={title} className="flex flex-col items-center gap-1">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/50 bg-black/60 font-serif text-2xl text-foreground shadow-[0_0_15px_rgba(228,42,99,0.12)]">
        {value}
      </span>
      <span className="font-sans text-xs font-bold tracking-wider text-accent-text uppercase">
        {label}
      </span>
      <span className="sr-only">{title}</span>
    </div>
  );
}
