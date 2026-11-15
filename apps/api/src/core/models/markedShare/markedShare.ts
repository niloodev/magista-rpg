import { getDatabase } from "@/core/services/database";
import { Prisma } from "@/generated/prisma/client";

import { SHARE_SELECT, UNIQUE_VIOLATION } from "./markedShare.constants";
import type { IMarkedShareModels } from "./markedShare.types";
import { toMarkedShare } from "./markedShare.utils";

const findActive: IMarkedShareModels["findActive"] = async () => {
  const row = await getDatabase().markedShare.findFirst({ select: SHARE_SELECT });
  return row ? toMarkedShare(row) : null;
};

const start: IMarkedShareModels["start"] = async ({ sourceCharacterId, trait }) => {
  try {
    const row = await getDatabase().markedShare.create({
      data: { sourceCharacterId, traitName: trait.name, traitDescription: trait.description },
      select: SHARE_SELECT,
    });
    return toMarkedShare(row);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION) {
      return null;
    }
    throw error;
  }
};

const stop: IMarkedShareModels["stop"] = async (id) => {
  const { count } = await getDatabase().markedShare.deleteMany({ where: { id } });
  return count > 0;
};

const stopBySource: IMarkedShareModels["stopBySource"] = async (characterId) => {
  const { count } = await getDatabase().markedShare.deleteMany({
    where: { sourceCharacterId: characterId },
  });
  return count > 0;
};

export const markedShareModels: IMarkedShareModels = { findActive, start, stop, stopBySource };
