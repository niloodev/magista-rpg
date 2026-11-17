export const TURN_HEX_CLASSES = {
  base: "relative flex h-11 w-10 shrink-0 items-center justify-center font-serif text-lg tabular-nums",
  idle: "text-foreground",
  current: "text-void-900",
  rolling: "text-foreground",
} as const;

/** The hexagon itself, a layer under the value (so the focus ring of the field is never clipped). */
export const TURN_HEX_SHAPE_CLASSES = {
  base: "absolute inset-0 transition-colors duration-300",
  idle: "bg-primary/25",
  current: "bg-gold-400",
  rolling: "animate-pulse-breath bg-primary/45 lite:animate-none",
} as const;

export const TURN_HEX_INPUT_CLASSES =
  "relative h-full w-full cursor-text bg-transparent text-center font-serif text-lg tabular-nums placeholder:text-current placeholder:opacity-60";
