import { getDatabase } from "@/core/services/database";

import { SCENE_ORDER } from "./arenaScene.constants";
import type { IArenaSceneModels } from "./arenaScene.types";
import { toArenaScene } from "./arenaScene.utils";

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

const setMapKey: IArenaSceneModels["setMapKey"] = async (id, key) =>
  getDatabase().$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<{ mapKey: string | null }[]>`
      SELECT "mapKey" FROM "arena_scenes" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (!locked) return null;
    const row = await tx.arenaScene.update({ where: { id }, data: { mapKey: key } });
    return { scene: toArenaScene(row), previousKey: locked.mapKey };
  });

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
  findActiveSceneId,
  setActiveScene,
};
