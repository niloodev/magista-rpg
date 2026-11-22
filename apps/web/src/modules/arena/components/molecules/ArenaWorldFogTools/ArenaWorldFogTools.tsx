import { memo } from "react";

import { WORLD_BRUSH, WORLD_TEXTS } from "@/modules/arena/arena.constants";
import { Button, Checkbox, Icon } from "@/shared/components/atoms";
import { Stepper } from "@/shared/components/molecules";

import { WORLD_FOG_TOOL_BUTTONS, WORLD_FOG_TOOL_CLASSES } from "./ArenaWorldFogTools.constants";
import type { ArenaWorldFogToolsProps } from "./ArenaWorldFogTools.types";

/**
 * The GM's fog panel on the world map, in the place of the selection bar: what the left button does (move the
 * party, paint clouds over regions the players do not know yet, or clear them), the brush size, covering or
 * clearing the whole map (confirmed) and seeing the fog as the players see it. The brush is for the pointer; the
 * keyboard way is covering or clearing the whole map.
 */
export const ArenaWorldFogTools = memo(function ArenaWorldFogTools({
  tool,
  radius,
  playerView,
  pending,
  onTool,
  onRadius,
  onPlayerView,
  onFill,
  className,
}: ArenaWorldFogToolsProps) {
  return (
    <section
      aria-label={WORLD_TEXTS.tools}
      className={`flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 whitespace-nowrap border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-sm lite:bg-void-900/95 lite:backdrop-blur-none ${className ?? ""}`}
    >
      <div className="flex items-center gap-1.5">
        {WORLD_FOG_TOOL_BUTTONS.map((entry) => (
          <button
            key={entry.tool}
            type="button"
            aria-pressed={tool === entry.tool}
            onClick={() => onTool(entry.tool)}
            className={`${WORLD_FOG_TOOL_CLASSES.base} ${tool === entry.tool ? WORLD_FOG_TOOL_CLASSES.on : WORLD_FOG_TOOL_CLASSES.off}`}
          >
            <Icon name={entry.icon} size={16} aria-hidden="true" />
            {entry.label}
          </button>
        ))}
      </div>
      <span aria-hidden="true" className="h-6 w-px bg-border" />
      <span className="font-sans text-xs font-semibold tracking-[0.12em] text-label uppercase">
        {WORLD_TEXTS.brush}
      </span>
      <Stepper
        label={WORLD_TEXTS.brush}
        value={radius}
        onValueChange={onRadius}
        min={WORLD_BRUSH.min}
        max={WORLD_BRUSH.max}
        step={WORLD_BRUSH.step}
      />
      <span aria-hidden="true" className="h-6 w-px bg-border" />
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => onFill("hide")}
        icon={<Icon name="cloud-fog" size={14} />}
      >
        {WORLD_TEXTS.hideAll}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => onFill("reveal")}
        icon={<Icon name="eraser" size={14} />}
      >
        {WORLD_TEXTS.revealAll}
      </Button>
      <span aria-hidden="true" className="h-6 w-px bg-border" />
      <Checkbox
        checked={playerView}
        onCheckedChange={onPlayerView}
        label={WORLD_TEXTS.playerView}
        tone="teal"
      />
    </section>
  );
});
