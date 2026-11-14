import { insertAt } from "@magista/shared";

import { getDatabase } from "@/core/services/database";
import type { Prisma } from "@/generated/prisma/client";

import type { IFolderModels } from "./folder.types";
import { toFolder } from "./folder.utils";

type Tx = Prisma.TransactionClient;

const ORDER = [{ position: "asc" as const }, { name: "asc" as const }];

async function writeFolderOrder(tx: Tx, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await tx.$executeRaw`
    UPDATE "character_folders" AS f SET "position" = (v.ord - 1)::int
    FROM unnest(${ids}::uuid[]) WITH ORDINALITY AS v(id, ord) WHERE f."id" = v.id`;
}

/**
 * Character order and folder live outside the sheet, so they are written with SQL that keeps
 * `updatedAt` (the sheet version used for save conflicts) untouched.
 */
async function writeCharacterOrder(tx: Tx, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await tx.$executeRaw`
    UPDATE "characters" AS c SET "position" = (v.ord - 1)::int
    FROM unnest(${ids}::uuid[]) WITH ORDINALITY AS v(id, ord) WHERE c."id" = v.id`;
}

async function setCharacterFolder(tx: Tx, from: string, to: string | null): Promise<void> {
  await tx.$executeRaw`
    UPDATE "characters" SET "folderId" = ${to}::uuid WHERE "folderId" = ${from}::uuid`;
}

async function folderIdsIn(tx: Tx, parentId: string | null): Promise<string[]> {
  const rows = await tx.characterFolder.findMany({
    where: { parentId },
    select: { id: true },
    orderBy: ORDER,
  });
  return rows.map((row) => row.id);
}

async function characterIdsIn(tx: Tx, folderId: string | null): Promise<string[]> {
  const rows = await tx.character.findMany({
    where: { folderId },
    select: { id: true },
    orderBy: ORDER,
  });
  return rows.map((row) => row.id);
}

const list: IFolderModels["list"] = async () => {
  const rows = await getDatabase().characterFolder.findMany({ orderBy: ORDER });
  return rows.map(toFolder);
};

const findById: IFolderModels["findById"] = async (id) => {
  const row = await getDatabase().characterFolder.findUnique({ where: { id } });
  return row ? toFolder(row) : null;
};

const create: IFolderModels["create"] = async ({ name, parentId }) => {
  const row = await getDatabase().$transaction(async (tx) => {
    const last = await tx.characterFolder.aggregate({
      where: { parentId },
      _max: { position: true },
    });
    return tx.characterFolder.create({
      data: { name, parentId, position: (last._max.position ?? -1) + 1 },
    });
  });
  return toFolder(row);
};

const rename: IFolderModels["rename"] = async (id, name) => {
  const row = await getDatabase().characterFolder.update({ where: { id }, data: { name } });
  return toFolder(row);
};

const remove: IFolderModels["remove"] = async (id) => {
  await getDatabase().$transaction(async (tx) => {
    const folder = await tx.characterFolder.findUniqueOrThrow({ where: { id } });
    const parentId = folder.parentId;
    const movedFolders = await folderIdsIn(tx, id);
    const movedCharacters = await characterIdsIn(tx, id);
    await tx.characterFolder.updateMany({ where: { parentId: id }, data: { parentId } });
    await setCharacterFolder(tx, id, parentId);
    await tx.characterFolder.delete({ where: { id } });
    const siblingFolders = (await folderIdsIn(tx, parentId)).filter(
      (existing) => !movedFolders.includes(existing),
    );
    const siblingCharacters = (await characterIdsIn(tx, parentId)).filter(
      (existing) => !movedCharacters.includes(existing),
    );
    await writeFolderOrder(tx, [...siblingFolders, ...movedFolders]);
    await writeCharacterOrder(tx, [...siblingCharacters, ...movedCharacters]);
  });
};

const moveFolder: IFolderModels["moveFolder"] = async (id, parentId, index) => {
  await getDatabase().$transaction(async (tx) => {
    const folder = await tx.characterFolder.findUniqueOrThrow({ where: { id } });
    await tx.characterFolder.update({ where: { id }, data: { parentId } });
    if (folder.parentId !== parentId) {
      await writeFolderOrder(tx, await folderIdsIn(tx, folder.parentId));
    }
    await writeFolderOrder(tx, insertAt(await folderIdsIn(tx, parentId), id, index));
  });
};

const moveCharacter: IFolderModels["moveCharacter"] = async (id, folderId, index) => {
  await getDatabase().$transaction(async (tx) => {
    const character = await tx.character.findUniqueOrThrow({
      where: { id },
      select: { folderId: true },
    });
    await tx.$executeRaw`UPDATE "characters" SET "folderId" = ${folderId}::uuid WHERE "id" = ${id}::uuid`;
    if (character.folderId !== folderId) {
      await writeCharacterOrder(tx, await characterIdsIn(tx, character.folderId));
    }
    await writeCharacterOrder(tx, insertAt(await characterIdsIn(tx, folderId), id, index));
  });
};

export const folderModels: IFolderModels = {
  list,
  findById,
  create,
  rename,
  remove,
  moveFolder,
  moveCharacter,
};
