import { getDatabase } from "@/core/services/database";
import { Prisma } from "@/generated/prisma/client";

import { TURN_ENTRY_ORDER, TURN_ENTRY_SELECT } from "./arenaTurn.constants";
import type { IArenaTurnModels } from "./arenaTurn.types";
import type { ArenaTurnSceneRow } from "./arenaTurn.utils";
import { toArenaTurnOrder } from "./arenaTurn.utils";

const findOrder: IArenaTurnModels["findOrder"] = async (sceneId) => {
  const db = getDatabase();
  const [scene, entries] = await Promise.all([
    db.arenaScene.findUnique({
      where: { id: sceneId },
      select: { id: true, turnRound: true, turnTokenId: true },
    }),
    db.arenaTurnEntry.findMany({
      where: { sceneId },
      select: TURN_ENTRY_SELECT,
      orderBy: TURN_ENTRY_ORDER,
    }),
  ]);
  return scene ? toArenaTurnOrder(scene, entries) : null;
};

/**
 * Writes the whole order: drops the entries that left, upserts the others with their new position (one statement)
 * and stores the round and the current token.
 */
const writeOrder = async (
  tx: Prisma.TransactionClient,
  sceneId: string,
  order: ReturnType<typeof toArenaTurnOrder>,
) => {
  const tokenIds = order.entries.map((entry) => entry.tokenId);
  await tx.arenaTurnEntry.deleteMany({ where: { sceneId, tokenId: { notIn: tokenIds } } });
  if (order.entries.length > 0) {
    const values = Prisma.join(
      order.entries.map(
        ({ tokenId, initiative }, position) =>
          Prisma.sql`(gen_random_uuid(), ${sceneId}::uuid, ${tokenId}::uuid, ${initiative}::int, ${position}::int, CURRENT_TIMESTAMP::timestamp(3))`,
      ),
    );
    await tx.$executeRaw`
      INSERT INTO "arena_turn_entries" ("id", "sceneId", "tokenId", "initiative", "position", "updatedAt")
      SELECT v.* FROM (VALUES ${values}) AS v("id", "sceneId", "tokenId", "initiative", "position", "updatedAt")
      JOIN "arena_tokens" t ON t."id" = v."tokenId" AND t."sceneId" = v."sceneId"
      ON CONFLICT ("tokenId") DO UPDATE SET
        "initiative" = EXCLUDED."initiative",
        "position" = EXCLUDED."position",
        "updatedAt" = EXCLUDED."updatedAt"`;
  }
  await tx.arenaScene.update({
    where: { id: sceneId },
    data: { turnRound: order.round, turnTokenId: order.currentTokenId },
  });
};

const change: IArenaTurnModels["change"] = async (sceneId, apply) =>
  getDatabase().$transaction(async (tx) => {
    const [scene] = await tx.$queryRaw<ArenaTurnSceneRow[]>`
      SELECT "id", "turnRound", "turnTokenId" FROM "arena_scenes"
      WHERE "id" = ${sceneId}::uuid FOR UPDATE`;
    if (!scene) return null;
    const entries = await tx.arenaTurnEntry.findMany({
      where: { sceneId },
      select: TURN_ENTRY_SELECT,
      orderBy: TURN_ENTRY_ORDER,
    });
    const stored = toArenaTurnOrder(scene, entries);
    const next = apply(stored);
    if (!next) return { order: stored, changed: false };
    await writeOrder(tx, sceneId, next);
    const written = await tx.arenaTurnEntry.findMany({
      where: { sceneId },
      select: TURN_ENTRY_SELECT,
      orderBy: TURN_ENTRY_ORDER,
    });
    const order = toArenaTurnOrder(
      { id: sceneId, turnRound: next.round, turnTokenId: next.currentTokenId },
      written,
    );
    return { order, changed: true };
  });

export const arenaTurnModels: IArenaTurnModels = { findOrder, change };
