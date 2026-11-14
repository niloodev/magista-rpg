"use client";

import { CharacterRow } from "@/modules/library/components/molecules";
import { ActionMenu } from "@/shared/components/molecules";

import { DragHandle } from "../DragHandle";
import { useTreeItem } from "../../hooks";
import type { TreeCharacterProps } from "./TreeCharacter.types";

export function TreeCharacter({ character, target, excluded }: TreeCharacterProps) {
  const { setRowRef, isDragging, dropPosition, pointerProps, handleProps } = useTreeItem(
    character.dragId,
    target,
    excluded,
    false,
  );
  return (
    <li ref={setRowRef} {...pointerProps} className="select-none">
      <CharacterRow
        name={character.name}
        subtitle={character.subtitle}
        href={character.href}
        portraitUrl={character.portraitUrl}
        accountLabels={character.accountLabels}
        dropPosition={dropPosition}
        dimmed={isDragging}
        handle={<DragHandle label={`Mover ficha ${character.name}`} {...handleProps} />}
        actions={<ActionMenu label={`Ações de ${character.name}`} items={character.menu} />}
      />
    </li>
  );
}
