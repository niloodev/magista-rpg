import { getDatabase } from "@/core/services/database";

import { TOKEN_INCLUDE, TOKEN_ORDER } from "./arenaToken.constants";
import type { IArenaTokenModels } from "./arenaToken.types";
import { toArenaToken } from "./arenaToken.utils";

const listByScene: IArenaTokenModels["listByScene"] = async (sceneId, { includeHidden }) => {
  const rows = await getDatabase().arenaToken.findMany({
    where: includeHidden ? { sceneId } : { sceneId, hidden: false },
    include: TOKEN_INCLUDE,
    orderBy: TOKEN_ORDER,
  });
  return rows.map(toArenaToken);
};

const findById: IArenaTokenModels["findById"] = async (id) => {
  const row = await getDatabase().arenaToken.findUnique({ where: { id }, include: TOKEN_INCLUDE });
  return row ? toArenaToken(row) : null;
};

const create: IArenaTokenModels["create"] = async (sceneId, input) => {
  const row = await getDatabase().$transaction(async (tx) => {
    const last = await tx.arenaToken.aggregate({ where: { sceneId }, _max: { position: true } });
    return tx.arenaToken.create({
      data: { sceneId, ...input, position: (last._max.position ?? -1) + 1 },
      include: TOKEN_INCLUDE,
    });
  });
  return toArenaToken(row);
};

const update: IArenaTokenModels["update"] = async (id, input) => {
  const { count } = await getDatabase().arenaToken.updateMany({ where: { id }, data: input });
  return count === 1 ? findById(id) : null;
};

const move: IArenaTokenModels["move"] = async (id, x, y, guard) => {
  const where = guard ? { id, sceneId: guard.sceneId, hidden: false } : { id };
  const { count } = await getDatabase().arenaToken.updateMany({ where, data: { x, y } });
  return count === 1 ? findById(id) : null;
};

const remove: IArenaTokenModels["remove"] = async (id) =>
  getDatabase().$transaction(async (tx) => {
    const row = await tx.arenaToken.findUnique({
      where: { id },
      select: { id: true, sceneId: true, hidden: true },
    });
    if (!row) return null;
    await tx.arenaToken.delete({ where: { id } });
    return row;
  });

const setImageKey: IArenaTokenModels["setImageKey"] = async (id, key) =>
  getDatabase().$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<{ imageKey: string | null }[]>`
      SELECT "imageKey" FROM "arena_tokens" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (!locked) return null;
    const row = await tx.arenaToken.update({
      where: { id },
      data: { imageKey: key },
      include: TOKEN_INCLUDE,
    });
    return { token: toArenaToken(row), previousKey: locked.imageKey };
  });

export const arenaTokenModels: IArenaTokenModels = {
  listByScene,
  findById,
  create,
  update,
  move,
  remove,
  setImageKey,
};
