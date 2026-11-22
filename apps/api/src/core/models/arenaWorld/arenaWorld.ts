import { getDatabase } from "@/core/services/database";

import { ARENA_WORLD_SELECT } from "./arenaWorld.constants";
import type { ArenaWorldRow, IArenaWorldModels } from "./arenaWorld.types";
import { toArenaWorldState } from "./arenaWorld.utils";

const SINGLETON = { singleton: true } as const;

const findWorld: IArenaWorldModels["findWorld"] = async () => {
  const row = await getDatabase().arenaState.findFirst({
    where: SINGLETON,
    select: ARENA_WORLD_SELECT,
  });
  return toArenaWorldState(row);
};

const setLive: IArenaWorldModels["setLive"] = async (live) => {
  const row = await getDatabase().arenaState.upsert({
    where: SINGLETON,
    create: { worldMapLive: live },
    update: { worldMapLive: live },
    select: ARENA_WORLD_SELECT,
  });
  return toArenaWorldState(row);
};

const moveParty: IArenaWorldModels["moveParty"] = async (party) => {
  const row = await getDatabase().arenaState.upsert({
    where: SINGLETON,
    create: { partyX: party.x, partyY: party.y },
    update: { partyX: party.x, partyY: party.y },
    select: ARENA_WORLD_SELECT,
  });
  return toArenaWorldState(row);
};

const changeFog: IArenaWorldModels["changeFog"] = async (apply) =>
  getDatabase().$transaction(async (tx) => {
    await tx.arenaState.upsert({ where: SINGLETON, create: {}, update: {} });
    const [locked] = await tx.$queryRaw<ArenaWorldRow[]>`
      SELECT "worldMapLive", "activeSceneId", "partyX", "partyY", "fogMask", "fogVersion"
      FROM "arena_state" WHERE "singleton" = true FOR UPDATE`;
    const current = toArenaWorldState(locked ?? null);
    const fog = apply(current.fog);
    const row = await tx.arenaState.update({
      where: SINGLETON,
      data: { fogMask: Buffer.from(fog), fogVersion: { increment: 1 } },
      select: ARENA_WORLD_SELECT,
    });
    return toArenaWorldState(row);
  });

export const arenaWorldModels: IArenaWorldModels = { findWorld, setLive, moveParty, changeFog };
