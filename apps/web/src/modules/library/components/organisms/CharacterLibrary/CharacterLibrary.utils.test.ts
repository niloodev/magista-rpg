import type { ICharacterSummary } from "@magista/shared";
import { describe, expect, it, vi } from "vitest";

import { PLACE_ON_MAP_LABEL } from "./CharacterLibrary.constants";
import { characterMenu } from "./CharacterLibrary.utils";

const character = {
  id: "c1",
  name: "Ana",
  folderId: null,
  position: 0,
  avatarUrl: null,
  artUrl: null,
  avatarThumbUrl: null,
  artThumbUrl: null,
  figureUrl: null,
  figureThumbUrl: null,
  tokenStyle: "portrait",
  showTokenName: true,
  classKey: "arcanista",
  level: 1,
  accountIds: [],
  features: [],
} satisfies ICharacterSummary;

describe("characterMenu", () => {
  it("offers to place the sheet on the map first only when the page can do it", () => {
    const open = vi.fn();
    expect(characterMenu(character, open).map((item) => item.label)).not.toContain(
      PLACE_ON_MAP_LABEL,
    );
    const place = vi.fn();
    const [first] = characterMenu(character, open, place);
    expect(first?.label).toBe(PLACE_ON_MAP_LABEL);
    first?.onSelect();
    expect(place).toHaveBeenCalledWith(character);
  });
});
