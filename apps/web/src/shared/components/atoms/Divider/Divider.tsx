import type { DividerProps } from "./Divider.types";

export function Divider({ label, className }: DividerProps) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`} role="separator">
      <span className="h-px flex-1 bg-linear-to-r from-transparent to-[rgba(232,38,98,0.32)]" />
      {label && (
        <span className="font-serif text-[0.58rem] tracking-[0.28em] whitespace-nowrap text-ornament">
          ✦ {label} ✦
        </span>
      )}
      <span className="h-px flex-1 bg-linear-to-r from-[rgba(232,38,98,0.32)] to-transparent" />
    </div>
  );
}
