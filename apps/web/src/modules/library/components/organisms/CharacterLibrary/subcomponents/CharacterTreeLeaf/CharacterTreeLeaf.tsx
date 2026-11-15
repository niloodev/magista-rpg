"use client";

import { CharacterRow } from "@/modules/library/components/molecules";
import { ActionMenu } from "@/shared/components/molecules";

import { useCharacterTreeLeaf } from "./CharacterTreeLeaf.hook";
import type { CharacterTreeLeafProps } from "./CharacterTreeLeaf.types";

export function CharacterTreeLeaf({
  character,
  slots,
  accountLogins,
  onDialog,
  onOpen,
}: CharacterTreeLeafProps) {
  const { subtitle, href, portraitUrl, accountLabels, menu } = useCharacterTreeLeaf({
    character,
    accountLogins,
    onDialog,
  });
  return (
    <CharacterRow
      id={character.id}
      name={character.name}
      subtitle={subtitle}
      href={href}
      onOpen={onOpen && (() => onOpen(character.id))}
      portraitUrl={portraitUrl}
      accountLabels={accountLabels}
      features={character.features}
      dropPosition={slots.dropPosition}
      dimmed={slots.dimmed}
      handle={slots.handle}
      actions={<ActionMenu label={`Ações de ${character.name}`} items={menu} />}
    />
  );
}
