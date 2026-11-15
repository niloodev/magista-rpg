import { ARENA_DOCK_TEXTS } from "@/modules/arena/arena.constants";
import { SheetPage } from "@/modules/sheet/components/pages";
import { Button, Icon } from "@/shared/components/atoms";

import type { ArenaDockedSheetProps } from "./ArenaDockedSheet.types";

/**
 * A sheet docked as a tab of a side panel: a small bar to take it back to a floating window or close it, and
 * the sheet in its panel layout (it adapts to the panel width).
 */
export function ArenaDockedSheet({ characterId, name, onUndock, onClose }: ArenaDockedSheetProps) {
  return (
    <>
      <div className="sticky top-0 z-40 flex justify-end gap-1 border-b border-white/10 bg-void-900/95 px-2 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndock}
          aria-label={ARENA_DOCK_TEXTS.undockLabel(name)}
          className="whitespace-nowrap"
          icon={<Icon name="picture-in-picture-2" size={14} />}
        >
          {ARENA_DOCK_TEXTS.undock}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label={ARENA_DOCK_TEXTS.closeLabel(name)}
          className="whitespace-nowrap"
          icon={<Icon name="x" size={14} />}
        >
          {ARENA_DOCK_TEXTS.close}
        </Button>
      </div>
      <SheetPage characterId={characterId} variant="panel" />
    </>
  );
}
