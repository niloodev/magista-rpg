import { useCallback, useMemo } from "react";

import { toMediaUrl } from "@/core/services/http";
import { characterSubtitle } from "@/modules/library/library.utils";
import { portraitOf } from "@/modules/sheet/sheet.utils";

import { accessLabels, characterMenu } from "../../CharacterLibrary.utils";
import type { CharacterTreeLeafProps } from "./CharacterTreeLeaf.types";

/**
 * Row data of a character inside the GM tree: subtitle, link, portrait, access badges and actions menu.
 */
export function useCharacterTreeLeaf({
  character,
  accountLogins,
  onDialog,
  onOpen,
  onPlace,
}: Omit<CharacterTreeLeafProps, "slots">) {
  const openRow = useCallback(() => onOpen?.(character.id), [onOpen, character.id]);
  const row = useMemo(
    () => ({
      subtitle: characterSubtitle(character),
      href: `/ficha/${character.id}`,
      portraitUrl: toMediaUrl(portraitOf(character)),
      accountLabels: accessLabels(character, accountLogins),
      menu: characterMenu(character, onDialog, onPlace),
    }),
    [character, accountLogins, onDialog, onPlace],
  );
  return { ...row, openRow };
}
