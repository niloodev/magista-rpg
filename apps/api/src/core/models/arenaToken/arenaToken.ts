import { randomUUID } from "node:crypto";

import { getDatabase } from "@/core/services/database";
import { assetIdOf } from "@/core/services/media";
import { Prisma } from "@/generated/prisma/client";

import { TOKEN_INCLUDE, TOKEN_ORDER } from "./arenaToken.constants";
import type { IArenaTokenModels, IUpdateArenaTokenRow } from "./arenaToken.types";
import type { ArenaTokenStatusSqlRow } from "./arenaToken.utils";
import { toArenaToken, tokenStatusOf } from "./arenaToken.utils";

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
    const character = input.characterId
      ? await tx.character.findUnique({
          where: { id: input.characterId },
          select: { showTokenName: true },
        })
      : null;
    return tx.arenaToken.create({
      data: {
        sceneId,
        ...input,
        showName: character?.showTokenName ?? true,
        position: (last._max.position ?? -1) + 1,
      },
      include: TOKEN_INCLUDE,
    });
  });
  return toArenaToken(row);
};

/**
 * Pastes copies of tokens; a copy shares the image only when it is a shared asset (an old per-token image key is
 * deleted with its token, so the copy starts without it).
 */
const copyMany: IArenaTokenModels["copyMany"] = async (sceneId, copies) => {
  if (copies.length === 0) return [];
  const created = await getDatabase().$transaction(async (tx) => {
    const sources = await tx.arenaToken.findMany({
      where: { id: { in: [...new Set(copies.map((copy) => copy.sourceId))] } },
      include: { statusViewers: { select: { accountId: true } } },
    });
    const byId = new Map(sources.map((source) => [source.id, source]));
    const last = await tx.arenaToken.aggregate({ where: { sceneId }, _max: { position: true } });
    const first = (last._max.position ?? -1) + 1;
    const rows = copies.flatMap((copy) => {
      const source = byId.get(copy.sourceId);
      return source ? [{ id: randomUUID(), source, copy }] : [];
    });
    if (rows.length === 0) return [];
    await tx.arenaToken.createMany({
      data: rows.map(({ id, source, copy }, index) => ({
        id,
        sceneId,
        characterId: source.characterId,
        name: source.name,
        imageKey: assetIdOf(source.imageKey) ? source.imageKey : null,
        tokenStyle: source.tokenStyle,
        showName: source.showName,
        x: copy.x,
        y: copy.y,
        size: source.size,
        hidden: source.hidden,
        position: first + index,
        healthCurrent: source.healthCurrent,
        healthMax: source.healthMax,
        sanityCurrent: source.sanityCurrent,
        sanityMax: source.sanityMax,
        statusPublic: source.statusPublic,
        initiativeBonus: source.initiativeBonus,
      })),
    });
    const viewers = rows.flatMap(({ id, source }) =>
      source.statusViewers.map(({ accountId }) => ({ tokenId: id, accountId })),
    );
    if (viewers.length > 0) await tx.arenaTokenStatusViewer.createMany({ data: viewers });
    return rows.map(({ id }) => id);
  });
  const tokens = await findManyByIds(created);
  const order = new Map<string, number>(created.map((id, index) => [id, index]));
  return tokens.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
};

/**
 * Writes one patch inside a transaction: the columns, then the status viewers when the patch replaces them.
 */
const writePatch = async (
  tx: Prisma.TransactionClient,
  id: string,
  patch: IUpdateArenaTokenRow,
) => {
  const { statusViewerIds, ...data } = patch;
  const { count } = await tx.arenaToken.updateMany({ where: { id }, data });
  if (count !== 1) return false;
  if (statusViewerIds) {
    await tx.arenaTokenStatusViewer.deleteMany({ where: { tokenId: id } });
    if (statusViewerIds.length > 0) {
      await tx.arenaTokenStatusViewer.createMany({
        data: statusViewerIds.map((accountId) => ({ tokenId: id, accountId })),
        skipDuplicates: true,
      });
    }
  }
  return true;
};

const update: IArenaTokenModels["update"] = async (id, input) => {
  const updated = await getDatabase().$transaction((tx) => writePatch(tx, id, input));
  return updated ? findById(id) : null;
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
      if (await writePatch(tx, id, patch)) ids.push(id);
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

const statusWhere = (query: Parameters<IArenaTokenModels["listStatuses"]>[0]) => {
  if ("ids" in query)
    return Prisma.sql`t."id" IN (${Prisma.join(query.ids.map((id) => Prisma.sql`${id}::uuid`))})`;
  if ("characterIds" in query) {
    const ids = Prisma.join(query.characterIds.map((id) => Prisma.sql`${id}::uuid`));
    return Prisma.sql`t."characterId" IN (${ids}) AND t."sceneId" = ${query.sceneId}::uuid AND t."hidden" = false`;
  }
  return query.includeHidden
    ? Prisma.sql`t."sceneId" = ${query.sceneId}::uuid`
    : Prisma.sql`t."sceneId" = ${query.sceneId}::uuid AND t."hidden" = false`;
};

/**
 * Reads statuses in one statement: only the resources of each sheet travel (never the whole sheet), and the
 * viewers come aggregated per token.
 */
const listStatuses: IArenaTokenModels["listStatuses"] = async (query) => {
  if ("ids" in query && query.ids.length === 0) return [];
  if ("characterIds" in query && query.characterIds.length === 0) return [];
  const rows = await getDatabase().$queryRaw<ArenaTokenStatusSqlRow[]>`
    SELECT t."id", t."sceneId", t."characterId", t."hidden",
      t."healthCurrent", t."healthMax", t."sanityCurrent", t."sanityMax", t."statusPublic",
      c."sheet" -> 'resources' AS "resources",
      ARRAY(SELECT v."accountId"::text FROM "arena_token_status_viewers" v WHERE v."tokenId" = t."id") AS "viewers"
    FROM "arena_tokens" t
    LEFT JOIN "characters" c ON c."id" = t."characterId"
    WHERE ${statusWhere(query)}`;
  return rows.map((row) => ({
    id: row.id,
    sceneId: row.sceneId,
    characterId: row.characterId,
    hidden: row.hidden,
    status: tokenStatusOf(row),
    access: { public: row.statusPublic, accountIds: row.viewers ?? [] },
  }));
};

const NPC_RESOURCE_COLUMNS = {
  health: { current: "healthCurrent", max: "healthMax" },
  sanity: { current: "sanityCurrent", max: "sanityMax" },
} as const;

const changeNpcResource: IArenaTokenModels["changeNpcResource"] = async (ids, resource, change) => {
  if (ids.length === 0) return [];
  const columns = NPC_RESOURCE_COLUMNS[resource];
  return getDatabase().$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string; current: number | null; max: number | null }[]>`
      SELECT "id", ${Prisma.raw(`"${columns.current}"`)} AS "current", ${Prisma.raw(`"${columns.max}"`)} AS "max"
      FROM "arena_tokens"
      WHERE "id" IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))}) AND "characterId" IS NULL
      ORDER BY "id" FOR UPDATE`;
    const updates = rows.flatMap((row) => {
      const next = change({ current: row.current, max: row.max });
      return next ? [{ id: row.id, current: next.current }] : [];
    });
    if (updates.length === 0) return [];
    const values = Prisma.join(
      updates.map(({ id, current }) => Prisma.sql`(${id}::uuid, ${current}::int)`),
    );
    await tx.$executeRaw`
      UPDATE "arena_tokens" t SET ${Prisma.raw(`"${columns.current}"`)} = v."current", "updatedAt" = ${new Date()}
      FROM (VALUES ${values}) AS v("id", "current")
      WHERE t."id" = v."id"`;
    const changed = updates.map((update) => update.id);
    return changed;
  });
};

export const arenaTokenModels: IArenaTokenModels = {
  listStatuses,
  changeNpcResource,
  listByScene,
  findById,
  findManyByIds,
  moveMany,
  create,
  copyMany,
  update,
  remove,
  updateMany,
  removeMany,
  setImageKey,
};
