import { CHARACTER_SHEET_VERSION } from "@magista/shared";

import { getDatabase } from "@/core/services/database";

import type { ICharacterModels } from "./character.types";
import { toCharacter } from "./character.utils";

const findByAccountId: ICharacterModels["findByAccountId"] = async (accountId) => {
  const row = await getDatabase().character.findUnique({ where: { accountId } });
  return row ? toCharacter(row) : null;
};

const upsertCharacter: ICharacterModels["upsertCharacter"] = async ({ accountId, name }) => {
  const row = await getDatabase().character.upsert({
    where: { accountId },
    create: { accountId, name, sheet: {}, sheetVersion: CHARACTER_SHEET_VERSION },
    update: { name },
  });
  return toCharacter(row);
};

export const characterModels: ICharacterModels = { findByAccountId, upsertCharacter };

export { findByAccountId, upsertCharacter };
