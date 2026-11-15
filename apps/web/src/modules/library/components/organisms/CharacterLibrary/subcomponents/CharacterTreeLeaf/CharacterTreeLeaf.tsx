"use client";

import { memo } from "react";

import { CharacterRow } from "@/modules/library/components/molecules";
import { ActionMenu } from "@/shared/components/molecules";

import { useCharacterTreeLeaf } from "./CharacterTreeLeaf.hook";
import type { CharacterTreeLeafProps } from "./CharacterTreeLeaf.types";

export const CharacterTreeLeaf = memo(function CharacterTreeLeaf({
  character,
  slots,
  accountLogins,
  onDialog,
  onOpen,
  onPlace,
}: CharacterTreeLeafProps) {
  const { subtitle, href, portraitUrl, accountLabels, menu, openRow } = useCharacterTreeLeaf({
    character,
    accountLogins,
    onDialog,
    onOpen,
    onPlace,
  });
  return (
    <CharacterRow
      id={character.id}
      name={character.name}
      subtitle={subtitle}
      href={href}
      onOpen={onOpen && openRow}
      portraitUrl={portraitUrl}
      accountLabels={accountLabels}
      features={character.features}
      dropPosition={slots.dropPosition}
      dimmed={slots.dimmed}
      handle={slots.handle}
      actions={<ActionMenu label={`Ações de ${character.name}`} items={menu} />}
    />
  );
});
