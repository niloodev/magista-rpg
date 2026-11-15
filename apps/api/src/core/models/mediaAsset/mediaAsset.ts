import { getDatabase } from "@/core/services/database";
import { Prisma } from "@/generated/prisma/client";

import { LINK_GRACE_MINUTES, UNIQUE_VIOLATION } from "./mediaAsset.constants";
import type { IMediaAsset, IMediaAssetModels } from "./mediaAsset.types";

const findByKey: IMediaAssetModels["findByKey"] = (key) =>
  getDatabase().mediaAsset.findUnique({ where: { key } });

const create: IMediaAssetModels["create"] = async (asset) => {
  try {
    return await getDatabase().mediaAsset.create({ data: asset });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION)
      return null;
    throw error;
  }
};

const countReferences: IMediaAssetModels["countReferences"] = async (key) => {
  const [row] = await getDatabase().$queryRaw<{ total: bigint }[]>`
    SELECT
      (SELECT COUNT(*) FROM "characters" WHERE "avatarKey" = ${key} OR "artKey" = ${key}) +
      (SELECT COUNT(*) FROM "arena_scenes" WHERE "mapKey" = ${key}) +
      (SELECT COUNT(*) FROM "arena_tokens" WHERE "imageKey" = ${key}) AS "total"`;
  return Number(row?.total ?? 0);
};

const linkByHash: IMediaAssetModels["linkByHash"] = async (hash) => {
  const [row] = await getDatabase().$queryRaw<IMediaAsset[]>`
    UPDATE "media_assets" SET "linkedAt" = NOW() WHERE "hash" = ${hash}
    RETURNING "id", "hash", "key", "thumbKey", "width", "height", "bytes", "contentType"`;
  return row ?? null;
};

const removeIfUnused: IMediaAssetModels["removeIfUnused"] = async (id, key) => {
  const rows = await getDatabase().$queryRaw<{ id: string }[]>`
    DELETE FROM "media_assets" a
    WHERE a."id" = ${id}::uuid
      AND a."linkedAt" < NOW() - make_interval(mins => ${LINK_GRACE_MINUTES})
      AND NOT EXISTS (SELECT 1 FROM "characters" c WHERE c."avatarKey" = ${key} OR c."artKey" = ${key})
      AND NOT EXISTS (SELECT 1 FROM "arena_scenes" s WHERE s."mapKey" = ${key})
      AND NOT EXISTS (SELECT 1 FROM "arena_tokens" t WHERE t."imageKey" = ${key})
    RETURNING a."id"`;
  return rows.length === 1;
};

const listUnreferenced: IMediaAssetModels["listUnreferenced"] = () =>
  getDatabase().$queryRaw<IMediaAsset[]>`
    SELECT a."id", a."hash", a."key", a."thumbKey", a."width", a."height", a."bytes", a."contentType"
    FROM "media_assets" a
    WHERE a."linkedAt" < NOW() - make_interval(mins => ${LINK_GRACE_MINUTES})
      AND NOT EXISTS (SELECT 1 FROM "characters" c WHERE c."avatarKey" = a."key" OR c."artKey" = a."key")
      AND NOT EXISTS (SELECT 1 FROM "arena_scenes" s WHERE s."mapKey" = a."key")
      AND NOT EXISTS (SELECT 1 FROM "arena_tokens" t WHERE t."imageKey" = a."key")`;

const listLegacyKeys: IMediaAssetModels["listLegacyKeys"] = async () => {
  const rows = await getDatabase().$queryRaw<{ key: string }[]>`
    SELECT DISTINCT "key" FROM (
      SELECT "avatarKey" AS "key" FROM "characters"
      UNION SELECT "artKey" FROM "characters"
      UNION SELECT "mapKey" FROM "arena_scenes"
      UNION SELECT "imageKey" FROM "arena_tokens"
    ) AS used
    WHERE "key" IS NOT NULL AND "key" NOT LIKE 'media/%'`;
  return rows.map((row) => row.key);
};

const replaceKey: IMediaAssetModels["replaceKey"] = async (from, to) => {
  await getDatabase().$transaction([
    getDatabase()
      .$executeRaw`UPDATE "characters" SET "avatarKey" = ${to} WHERE "avatarKey" = ${from}`,
    getDatabase().$executeRaw`UPDATE "characters" SET "artKey" = ${to} WHERE "artKey" = ${from}`,
    getDatabase().$executeRaw`UPDATE "arena_scenes" SET "mapKey" = ${to} WHERE "mapKey" = ${from}`,
    getDatabase()
      .$executeRaw`UPDATE "arena_tokens" SET "imageKey" = ${to} WHERE "imageKey" = ${from}`,
  ]);
};

export const mediaAssetModels: IMediaAssetModels = {
  findByKey,
  create,
  countReferences,
  linkByHash,
  removeIfUnused,
  listUnreferenced,
  listLegacyKeys,
  replaceKey,
};
