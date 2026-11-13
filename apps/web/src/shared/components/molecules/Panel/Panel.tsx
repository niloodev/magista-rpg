import { PANEL_VARIANTS } from "./Panel.constants";
import type { PanelProps } from "./Panel.types";

export function Panel({
  variant = "glass",
  brackets = false,
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <div
      className={`group relative transition-colors duration-500 ${PANEL_VARIANTS[variant]} ${className ?? ""}`}
      {...props}
    >
      {brackets && (
        <>
          <span className="absolute top-0 left-0 h-2 w-2 border-t border-l border-primary/50 transition-colors duration-500 group-hover:border-primary" />
          <span className="absolute right-0 bottom-0 h-2 w-2 border-r border-b border-primary/50 transition-colors duration-500 group-hover:border-primary" />
        </>
      )}
      {children}
    </div>
  );
}
