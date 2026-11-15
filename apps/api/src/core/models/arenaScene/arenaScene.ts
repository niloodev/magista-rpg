import { fitBoard, resolveBoard, scaleBoardPoint, type IArenaBounds } from "@magista/shared";

import { getDatabase } from "@/core/services/database";
import type { Prisma } from "@/generated/prisma/client";

import { SCENE_ORDER } from "./arenaScene.constants";
import type { IArenaSceneModels } from "./arenaScene.types";
import { mapSizeOf, toArenaScene, type ArenaSceneRow } from "./arenaScene.utils";

type Transaction = Prisma.TransactionClient;

const lockScene = async (tx: Transaction, id: string) => {
  const [locked] = await tx.$queryRaw<ArenaSceneRow[]>`
    SELECT "id", "name", "folderId", "mapKey", "mapWidth", "mapHeight", "boardWidth", "boardHeight",
      "position"
    FROM "arena_scenes" WHERE "id" = ${id}::uuid FOR UPDATE`;
  return locked ?? null;
};

/**
 * Moves every token of a scene so it stays on the same spot of the map after the board changed size.
 */
const rescaleTokens = async (tx: Transaction, id: string, from: IArenaBounds, to: IArenaBounds) => {
  if (from.width === to.width && from.height === to.height) return;
  const tokens = await tx.arenaToken.findMany({
    where: { sceneId: id },
    select: { id: true, x: true, y: true },
  });
  for (const token of tokens)
    await tx.arenaToken.update({ where: { id: token.id }, data: scaleBoardPoint(token, from, to) });
};

const list: IArenaSceneModels["list"] = async () => {
  const rows = await getDatabase().arenaScene.findMany({ orderBy: SCENE_ORDER });
  return rows.map(toArenaScene);
};

const findById: IArenaSceneModels["findById"] = async (id) => {
  const row = await getDatabase().arenaScene.findUnique({ where: { id } });
  return row ? toArenaScene(row) : null;
};

const create: IArenaSceneModels["create"] = async (name, folderId) => {
  const row = await getDatabase().$transaction(async (tx) => {
    const last = await tx.arenaScene.aggregate({ where: { folderId }, _max: { position: true } });
    return tx.arenaScene.create({
      data: { name, folderId, position: (last._max.position ?? -1) + 1 },
    });
  });
  return toArenaScene(row);
};

const rename: IArenaSceneModels["rename"] = async (id, name) => {
  const { count } = await getDatabase().arenaScene.updateMany({ where: { id }, data: { name } });
  return count === 1 ? findById(id) : null;
};

const remove: IArenaSceneModels["remove"] = async (id) =>
  getDatabase().$transaction(async (tx) => {
    const tokens = await tx.arenaToken.findMany({ where: { sceneId: id }, select: { id: true } });
    const { count } = await tx.arenaScene.deleteMany({ where: { id } });
    return count === 1 ? { tokenIds: tokens.map((token) => token.id) } : null;
  });

const setMapKey: IArenaSceneModels["setMapKey"] = async (id, key, size) =>
  getDatabase().$transaction(async (tx) => {
    const locked = await lockScene(tx, id);
    if (!locked) return null;
    const unmeasured =
      locked.mapKey !== null && mapSizeOf(locked) === null && locked.boardWidth === null;
    const before = unmeasured ? null : resolveBoard(locked);
    const keepsWidth = locked.boardWidth !== null || locked.mapKey !== null;
    const board = fitBoard({ width: before && keepsWidth ? before.width : size.width }, size);
    const row = await tx.arenaScene.update({
      where: { id },
      data: {
        mapKey: key,
        mapWidth: size.width,
        mapHeight: size.height,
        boardWidth: board.width,
        boardHeight: board.height,
      },
    });
    if (before) await rescaleTokens(tx, id, before, board);
    return { scene: toArenaScene(row), previousKey: locked.mapKey };
  });

const setBoard: IArenaSceneModels["setBoard"] = async (id, request) =>
  getDatabase().$transaction(async (tx) => {
    const locked = await lockScene(tx, id);
    if (!locked) return null;
    const before = resolveBoard(locked);
    const board = fitBoard(request, mapSizeOf(locked));
    const row = await tx.arenaScene.update({
      where: { id },
      data: { boardWidth: board.width, boardHeight: board.height },
    });
    await rescaleTokens(tx, id, before, board);
    return toArenaScene(row);
  });

const setMapSize: IArenaSceneModels["setMapSize"] = async (id, size) => {
  await getDatabase().arenaScene.updateMany({
    where: { id, mapWidth: null },
    data: { mapWidth: size.width, mapHeight: size.height },
  });
  return findById(id);
};

const findUnmeasuredMaps: IArenaSceneModels["findUnmeasuredMaps"] = async () => {
  const rows = await getDatabase().arenaScene.findMany({
    where: { mapKey: { not: null }, mapWidth: null },
    select: { id: true, mapKey: true },
  });
  return rows.flatMap((row) => (row.mapKey ? [{ id: row.id, mapKey: row.mapKey }] : []));
};

const findBoards: IArenaSceneModels["findBoards"] = async (ids) => {
  const rows = await getDatabase().arenaScene.findMany({ where: { id: { in: ids } } });
  return new Map(rows.map((row) => [row.id, resolveBoard(row)]));
};

const findActiveSceneId: IArenaSceneModels["findActiveSceneId"] = async () => {
  const row = await getDatabase().arenaState.findUnique({
    where: { singleton: true },
    select: { activeSceneId: true },
  });
  return row?.activeSceneId ?? null;
};

const setActiveScene: IArenaSceneModels["setActiveScene"] = async (id) => {
  await getDatabase().arenaState.upsert({
    where: { singleton: true },
    create: { activeSceneId: id },
    update: { activeSceneId: id },
  });
};

export const arenaSceneModels: IArenaSceneModels = {
  list,
  findById,
  create,
  rename,
  remove,
  setMapKey,
  setBoard,
  setMapSize,
  findUnmeasuredMaps,
  findBoards,
  findActiveSceneId,
  setActiveScene,
};
