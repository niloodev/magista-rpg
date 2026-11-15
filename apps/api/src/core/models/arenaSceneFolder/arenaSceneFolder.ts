import { insertAt, isSameOrDescendant } from "@magista/shared";

import { getDatabase } from "@/core/services/database";
import type { Prisma } from "@/generated/prisma/client";

import { FOLDER_ORDER } from "./arenaSceneFolder.constants";
import type { IArenaSceneFolderModels } from "./arenaSceneFolder.types";
import { toArenaFolder, toFolderLink } from "./arenaSceneFolder.utils";

type Tx = Prisma.TransactionClient;

async function writeFolderOrder(tx: Tx, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await tx.$executeRaw`
    UPDATE "arena_scene_folders" AS f SET "position" = (v.ord - 1)::int
    FROM unnest(${ids}::uuid[]) WITH ORDINALITY AS v(id, ord) WHERE f."id" = v.id`;
}

async function writeSceneOrder(tx: Tx, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await tx.$executeRaw`
    UPDATE "arena_scenes" AS s SET "position" = (v.ord - 1)::int
    FROM unnest(${ids}::uuid[]) WITH ORDINALITY AS v(id, ord) WHERE s."id" = v.id`;
}

async function folderIdsIn(tx: Tx, parentId: string | null): Promise<string[]> {
  const rows = await tx.arenaSceneFolder.findMany({
    where: { parentId },
    select: { id: true },
    orderBy: FOLDER_ORDER,
  });
  return rows.map((row) => row.id);
}

async function sceneIdsIn(tx: Tx, folderId: string | null): Promise<string[]> {
  const rows = await tx.arenaScene.findMany({
    where: { folderId },
    select: { id: true },
    orderBy: FOLDER_ORDER,
  });
  return rows.map((row) => row.id);
}

const list: IArenaSceneFolderModels["list"] = async () => {
  const rows = await getDatabase().arenaSceneFolder.findMany({ orderBy: FOLDER_ORDER });
  return rows.map(toArenaFolder);
};

const findById: IArenaSceneFolderModels["findById"] = async (id) => {
  const row = await getDatabase().arenaSceneFolder.findUnique({ where: { id } });
  return row ? toArenaFolder(row) : null;
};

const create: IArenaSceneFolderModels["create"] = async (name, parentId) => {
  const row = await getDatabase().$transaction(async (tx) => {
    const last = await tx.arenaSceneFolder.aggregate({
      where: { parentId },
      _max: { position: true },
    });
    return tx.arenaSceneFolder.create({
      data: { name, parentId, position: (last._max.position ?? -1) + 1 },
    });
  });
  return toArenaFolder(row);
};

const rename: IArenaSceneFolderModels["rename"] = async (id, name) => {
  const { count } = await getDatabase().arenaSceneFolder.updateMany({
    where: { id },
    data: { name },
  });
  return count === 1 ? findById(id) : null;
};

const remove: IArenaSceneFolderModels["remove"] = async (id) =>
  getDatabase().$transaction(async (tx) => {
    const folder = await tx.arenaSceneFolder.findUnique({ where: { id } });
    if (!folder) return false;
    const parentId = folder.parentId;
    const movedFolders = await folderIdsIn(tx, id);
    const movedScenes = await sceneIdsIn(tx, id);
    await tx.arenaSceneFolder.updateMany({ where: { parentId: id }, data: { parentId } });
    await tx.arenaScene.updateMany({ where: { folderId: id }, data: { folderId: parentId } });
    await tx.arenaSceneFolder.delete({ where: { id } });
    const siblingFolders = (await folderIdsIn(tx, parentId)).filter(
      (existing) => !movedFolders.includes(existing),
    );
    const siblingScenes = (await sceneIdsIn(tx, parentId)).filter(
      (existing) => !movedScenes.includes(existing),
    );
    await writeFolderOrder(tx, [...siblingFolders, ...movedFolders]);
    await writeSceneOrder(tx, [...siblingScenes, ...movedScenes]);
    return true;
  });

const moveFolder: IArenaSceneFolderModels["moveFolder"] = async (id, parentId, index) =>
  getDatabase().$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string; parentId: string | null }[]>`
      SELECT "id", "parentId" FROM "arena_scene_folders" FOR UPDATE`;
    if (parentId && isSameOrDescendant(rows.map(toFolderLink), parentId, id)) return false;
    const folder = rows.find((row) => row.id === id);
    if (!folder) return false;
    await tx.arenaSceneFolder.update({ where: { id }, data: { parentId } });
    if (folder.parentId !== parentId)
      await writeFolderOrder(tx, await folderIdsIn(tx, folder.parentId));
    await writeFolderOrder(tx, insertAt(await folderIdsIn(tx, parentId), id, index));
    return true;
  });

const moveScene: IArenaSceneFolderModels["moveScene"] = async (id, folderId, index) => {
  await getDatabase().$transaction(async (tx) => {
    const scene = await tx.arenaScene.findUniqueOrThrow({
      where: { id },
      select: { folderId: true },
    });
    await tx.arenaScene.update({ where: { id }, data: { folderId } });
    if (scene.folderId !== folderId)
      await writeSceneOrder(tx, await sceneIdsIn(tx, scene.folderId));
    await writeSceneOrder(tx, insertAt(await sceneIdsIn(tx, folderId), id, index));
  });
};

export const arenaSceneFolderModels: IArenaSceneFolderModels = {
  list,
  findById,
  create,
  rename,
  remove,
  moveFolder,
  moveScene,
};
