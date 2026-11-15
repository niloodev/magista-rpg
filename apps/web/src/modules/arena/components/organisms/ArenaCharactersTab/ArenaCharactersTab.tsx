import { ARENA_CHARACTERS_HINT_ID, ARENA_PLACEMENT_TEXTS } from "@/modules/arena/arena.constants";
import { CharacterLibrary } from "@/modules/library/components";
import { Button, Icon } from "@/shared/components/atoms";

import type { ArenaCharactersTabProps } from "./ArenaCharactersTab.types";

/**
 * "Fichas" tab of the Arena sidebar: the sheet library (rows open the sheet in a window). For the GM, with a
 * scene open, sheets can be dragged onto the map or placed from their menu, and "Token avulso" creates an NPC.
 */
export function ArenaCharactersTab({
  isGm,
  canPlace,
  onOpenCharacter,
  onPlaceCharacter,
  onDropCharacter,
  onNewNpc,
}: ArenaCharactersTabProps) {
  const placing = isGm && canPlace;
  return (
    <div className="flex flex-col gap-4">
      {isGm && (
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            size="sm"
            block
            disabled={!canPlace}
            aria-describedby={ARENA_CHARACTERS_HINT_ID}
            onClick={onNewNpc}
            icon={<Icon name="user-plus" size={14} />}
          >
            {ARENA_PLACEMENT_TEXTS.npcButton}
          </Button>
          <p id={ARENA_CHARACTERS_HINT_ID} className="font-sans text-xs text-muted-strong">
            {canPlace ? ARENA_PLACEMENT_TEXTS.dragHint : ARENA_PLACEMENT_TEXTS.noScene}
          </p>
        </div>
      )}
      <CharacterLibrary
        variant="sidebar"
        onOpenCharacter={onOpenCharacter}
        onPlaceCharacter={placing ? onPlaceCharacter : undefined}
        onDropCharacter={placing ? onDropCharacter : undefined}
      />
    </div>
  );
}
