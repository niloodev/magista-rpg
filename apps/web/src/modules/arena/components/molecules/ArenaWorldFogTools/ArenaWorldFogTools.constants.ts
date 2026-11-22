import { WORLD_TEXTS } from "@/modules/arena/arena.constants";
import type { WorldFogTool } from "@/modules/arena/arena.types";
import type { IconName } from "@/shared/components/atoms";

/** The tools of the fog panel, in order: move the party, paint clouds, clear them. */
export const WORLD_FOG_TOOL_BUTTONS: readonly {
  tool: WorldFogTool;
  label: string;
  icon: IconName;
}[] = [
  { tool: "move", label: WORLD_TEXTS.move, icon: "move" },
  { tool: "hide", label: WORLD_TEXTS.hide, icon: "cloud-fog" },
  { tool: "reveal", label: WORLD_TEXTS.reveal, icon: "eraser" },
];

export const WORLD_FOG_TOOL_CLASSES = {
  base: "inline-flex h-9 cursor-pointer items-center gap-1.5 border px-2.5 font-serif text-sm tracking-wide transition-colors duration-200 focus-visible:outline-offset-2",
  on: "border-gold-400/70 bg-gold-400/10 text-gold-300",
  off: "border-white/10 bg-black/40 text-muted-strong hover:border-primary/40 hover:text-foreground",
} as const;
