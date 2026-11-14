import { CHARACTER_SHEET_VERSION, createEmptySheet } from "@magista/shared";

import { getDatabase } from "@/core/services/database";
import type { Prisma } from "@/generated/prisma/client";

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

const updateMedia: ICharacterModels["updateMedia"] = async (id, media) => {
  const row = await getDatabase().character.update({ where: { id }, data: media });
  return toCharacter(row);
};

const upsertCharacter: ICharacterModels["upsertCharacter"] = async (input) => {
  const sheet = input.sheet ?? createEmptySheet();
  const data = {
    name: input.name,
    sheet,
    sheetVersion: CHARACTER_SHEET_VERSION,
    ...(input.legacy === undefined ? {} : { legacy: input.legacy as Prisma.InputJsonValue }),
    ...(input.avatarUrl === undefined ? {} : { avatarUrl: input.avatarUrl }),
    ...(input.tokenUrl === undefined ? {} : { tokenUrl: input.tokenUrl }),
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
  updateMedia,
  upsertCharacter,
};
