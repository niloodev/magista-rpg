import { getDatabase } from "@/core/services/database";
import { Prisma } from "@/generated/prisma/client";

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

const findManyByIds: IArenaTokenModels["findManyByIds"] = async (ids) => {
  if (ids.length === 0) return [];
  const rows = await getDatabase().arenaToken.findMany({
    where: { id: { in: ids } },
    include: TOKEN_INCLUDE,
  });
  return rows.map(toArenaToken);
};

/**
 * Moves a batch of tokens in one statement (the guard keeps a player's moves on visible tokens of the live scene).
 */
const moveMany: IArenaTokenModels["moveMany"] = async (moves, guard) => {
  if (moves.length === 0) return [];
  const values = Prisma.join(
    moves.map(({ tokenId, x, y }) => Prisma.sql`(${tokenId}::uuid, ${x}::float8, ${y}::float8)`),
  );
  const guardSql = guard
    ? Prisma.sql`AND t."sceneId" = ${guard.sceneId}::uuid AND t."hidden" = false`
    : Prisma.empty;
  const moved = await getDatabase().$queryRaw<{ id: string }[]>`
    UPDATE "arena_tokens" t SET "x" = v."x", "y" = v."y", "updatedAt" = ${new Date()}
    FROM (VALUES ${values}) AS v("id", "x", "y")
    WHERE t."id" = v."id" ${guardSql}
    RETURNING t."id"`;
  return findManyByIds(moved.map((row) => row.id));
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

const remove: IArenaTokenModels["remove"] = async (id) =>
  getDatabase().$transaction(async (tx) => {
    const row = await tx.arenaToken.findUnique({
      where: { id },
      select: { id: true, sceneId: true, hidden: true, imageKey: true },
    });
    if (!row) return null;
    await tx.arenaToken.delete({ where: { id } });
    return row;
  });

const updateMany: IArenaTokenModels["updateMany"] = async (patches) => {
  if (patches.length === 0) return [];
  const updatedIds = await getDatabase().$transaction(async (tx) => {
    const ids: string[] = [];
    for (const { id, patch } of patches) {
      const { count } = await tx.arenaToken.updateMany({ where: { id }, data: patch });
      if (count === 1) ids.push(id);
    }
    return ids;
  });
  return findManyByIds(updatedIds);
};

const removeMany: IArenaTokenModels["removeMany"] = async (ids) => {
  if (ids.length === 0) return [];
  return getDatabase().$transaction(async (tx) => {
    const rows = await tx.arenaToken.findMany({
      where: { id: { in: ids } },
      select: { id: true, sceneId: true, hidden: true, imageKey: true },
    });
    await tx.arenaToken.deleteMany({ where: { id: { in: rows.map((row) => row.id) } } });
    return rows;
  });
};

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
  findManyByIds,
  moveMany,
  create,
  update,
  remove,
  updateMany,
  removeMany,
  setImageKey,
};
