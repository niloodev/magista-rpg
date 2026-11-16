import {
  CHARACTER_SHEET_VERSION,
  characterPortrait,
  createEmptySheet,
  normalizeFeatures,
  sheetResourceOf,
} from "@magista/shared";

import { getDatabase } from "@/core/services/database";
import { characterImageUrls } from "@/core/services/media";
import { Prisma } from "@/generated/prisma/client";

import { SUMMARY_SELECT } from "./character.constants";
import type { ICharacterModels } from "./character.types";
import { toCharacter, toCharacterSummary } from "./character.utils";

const findById: ICharacterModels["findById"] = async (id) => {
  const row = await getDatabase().character.findUnique({ where: { id } });
  return row ? toCharacter(row) : null;
};

const exists: ICharacterModels["exists"] = async (id) => {
  const row = await getDatabase().character.findUnique({ where: { id }, select: { id: true } });
  return row !== null;
};

const hasAccess: ICharacterModels["hasAccess"] = async (characterId, accountId) => {
  const row = await getDatabase().characterAccess.findUnique({
    where: { characterId_accountId: { characterId, accountId } },
    select: { characterId: true },
  });
  return row !== null;
};

const listAccessibleIds: ICharacterModels["listAccessibleIds"] = async (accountId) => {
  const rows = await getDatabase().characterAccess.findMany({
    where: { accountId },
    select: { characterId: true },
  });
  return rows.map((row) => row.characterId);
};

const listAccountIds: ICharacterModels["listAccountIds"] = async (characterId) => {
  const rows = await getDatabase().characterAccess.findMany({
    where: { characterId },
    select: { accountId: true },
  });
  return rows.map((row) => row.accountId);
};

const findByAccountAndName: ICharacterModels["findByAccountAndName"] = async (accountId, name) => {
  const row = await getDatabase().character.findFirst({
    where: { name: { equals: name.trim(), mode: "insensitive" }, access: { some: { accountId } } },
  });
  return row ? toCharacter(row) : null;
};

const listSummaries: ICharacterModels["listSummaries"] = async () => {
  const rows = await getDatabase().character.findMany({
    select: SUMMARY_SELECT,
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  return rows.map(toCharacterSummary);
};

const listSummariesForAccount: ICharacterModels["listSummariesForAccount"] = async (accountId) => {
  const rows = await getDatabase().character.findMany({
    where: { access: { some: { accountId } } },
    select: SUMMARY_SELECT,
    orderBy: { name: "asc" },
  });
  return rows.map((row) => ({ ...toCharacterSummary(row), folderId: null, accountIds: [] }));
};

const findSummary: ICharacterModels["findSummary"] = async (id) => {
  const row = await getDatabase().character.findUnique({ where: { id }, select: SUMMARY_SELECT });
  return row ? toCharacterSummary(row) : null;
};

const create: ICharacterModels["create"] = async ({ name, folderId, sheet }) => {
  const database = getDatabase();
  const row = await database.$transaction(async (tx) => {
    const last = await tx.character.aggregate({ where: { folderId }, _max: { position: true } });
    return tx.character.create({
      data: {
        name,
        folderId,
        sheet,
        sheetVersion: CHARACTER_SHEET_VERSION,
        position: (last._max.position ?? -1) + 1,
      },
      select: SUMMARY_SELECT,
    });
  });
  return toCharacterSummary(row);
};

const rename: ICharacterModels["rename"] = async (id, name) => {
  const database = getDatabase();
  await database.$executeRaw`UPDATE "characters" SET "name" = ${name} WHERE "id" = ${id}::uuid`;
  const row = await database.character.findUniqueOrThrow({ where: { id }, select: SUMMARY_SELECT });
  return toCharacterSummary(row);
};

const remove: ICharacterModels["remove"] = async (id) => {
  await getDatabase().character.delete({ where: { id } });
};

const setAccess: ICharacterModels["setAccess"] = async (id, accountIds) => {
  const { row, previous } = await getDatabase().$transaction(async (tx) => {
    const previous = await tx.characterAccess.findMany({
      where: { characterId: id },
      select: { accountId: true },
    });
    await tx.characterAccess.deleteMany({
      where: { characterId: id, accountId: { notIn: accountIds } },
    });
    await tx.characterAccess.createMany({
      data: accountIds.map((accountId) => ({ characterId: id, accountId })),
      skipDuplicates: true,
    });
    const row = await tx.character.findUniqueOrThrow({ where: { id }, select: SUMMARY_SELECT });
    return { row, previous };
  });
  return {
    character: toCharacterSummary(row),
    previousAccountIds: previous.map((entry) => entry.accountId),
  };
};

const updateSheet: ICharacterModels["updateSheet"] = async (id, sheet, expectedUpdatedAt) => {
  const expected = new Date(expectedUpdatedAt);
  if (Number.isNaN(expected.getTime())) return null;
  const { count } = await getDatabase().character.updateMany({
    where: { id, updatedAt: expected },
    data: { sheet, sheetVersion: CHARACTER_SHEET_VERSION, updatedAt: new Date() },
  });
  return count === 1 ? findById(id) : null;
};

const changeResource: ICharacterModels["changeResource"] = async (ids, resource, change) => {
  if (ids.length === 0) return [];
  const changed = await getDatabase().$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string; resources: unknown }[]>`
      SELECT "id", "sheet" -> 'resources' AS "resources" FROM "characters"
      WHERE "id" IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))})
      ORDER BY "id" FOR UPDATE`;
    const updates = rows.flatMap((row) => {
      const next = change(sheetResourceOf(row.resources, resource));
      return next ? [{ id: row.id, current: next.current }] : [];
    });
    if (updates.length === 0) return [];
    const path = `{resources,${resource},current}`;
    const values = Prisma.join(
      updates.map(({ id, current }) => Prisma.sql`(${id}::uuid, ${current}::int)`),
    );
    await tx.$executeRaw`
      UPDATE "characters" c
      SET "sheet" = jsonb_set(c."sheet", ${path}::text[], COALESCE(to_jsonb(v."current"), 'null'::jsonb)),
        "updatedAt" = ${new Date()}
      FROM (VALUES ${values}) AS v("id", "current")
      WHERE c."id" = v."id"`;
    const done = updates.map((update) => update.id);
    return done;
  });
  if (changed.length === 0) return [];
  const rows = await getDatabase().character.findMany({ where: { id: { in: changed } } });
  return rows.map(toCharacter);
};

const findImageKeys: ICharacterModels["findImageKeys"] = async (id) =>
  getDatabase().character.findUnique({ where: { id }, select: { avatarKey: true, artKey: true } });

const setImageKey: ICharacterModels["setImageKey"] = async (id, kind, key) =>
  getDatabase().$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<{ avatarKey: string | null; artKey: string | null }[]>`
      SELECT "avatarKey", "artKey" FROM "characters" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (!locked) throw new Error(`Personagem ${id} não encontrado`);
    if (kind === "avatar") {
      await tx.$executeRaw`UPDATE "characters" SET "avatarKey" = ${key} WHERE "id" = ${id}::uuid`;
    } else {
      await tx.$executeRaw`UPDATE "characters" SET "artKey" = ${key} WHERE "id" = ${id}::uuid`;
    }
    const avatarKey = kind === "avatar" ? key : locked.avatarKey;
    const artKey = kind === "art" ? key : locked.artKey;
    return {
      images: { id, ...characterImageUrls(avatarKey, artKey) },
      previousKey: kind === "avatar" ? locked.avatarKey : locked.artKey,
    };
  });

const upsertCharacter: ICharacterModels["upsertCharacter"] = async (input) => {
  const sheet = input.sheet ?? createEmptySheet();
  const data = {
    name: input.name,
    sheet,
    sheetVersion: CHARACTER_SHEET_VERSION,
    ...(input.legacy === undefined ? {} : { legacy: input.legacy as Prisma.InputJsonValue }),
    ...(input.avatarKey === undefined ? {} : { avatarKey: input.avatarKey }),
    ...(input.artKey === undefined ? {} : { artKey: input.artKey }),
  };
  const access = {
    connectOrCreate: input.accountIds.map((accountId) => ({
      where: { characterId_accountId: { characterId: input.id ?? "", accountId } },
      create: { accountId },
    })),
  };
  const row = input.id
    ? await getDatabase().character.update({
        where: { id: input.id },
        data: { ...data, access },
      })
    : await getDatabase().character.create({
        data: { ...data, access: { create: input.accountIds.map((accountId) => ({ accountId })) } },
      });
  return toCharacter(row);
};

const setFeatures: ICharacterModels["setFeatures"] = async (id, features) =>
  getDatabase().$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<{ features: string[] | null }[]>`
      SELECT "features" FROM "characters" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (!locked) throw new Error(`Personagem ${id} não encontrado`);
    await tx.$executeRaw`UPDATE "characters" SET "features" = ${features}::text[] WHERE "id" = ${id}::uuid`;
    const access = await tx.characterAccess.findMany({
      where: { characterId: id },
      select: { accountId: true },
    });
    return {
      features,
      previous: normalizeFeatures(locked.features ?? []),
      accountIds: access.map((entry) => entry.accountId),
    };
  });

const listByFeature: ICharacterModels["listByFeature"] = async (feature) => {
  const rows = await getDatabase().character.findMany({
    where: { features: { has: feature } },
    select: { id: true, name: true, avatarKey: true, artKey: true },
    orderBy: { name: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    portraitUrl: characterPortrait(characterImageUrls(row.avatarKey, row.artKey)),
  }));
};

export const characterModels: ICharacterModels = {
  findById,
  exists,
  hasAccess,
  listAccessibleIds,
  listAccountIds,
  findByAccountAndName,
  listSummaries,
  listSummariesForAccount,
  findSummary,
  create,
  rename,
  remove,
  setAccess,
  updateSheet,
  changeResource,
  findImageKeys,
  setImageKey,
  upsertCharacter,
  setFeatures,
  listByFeature,
};
