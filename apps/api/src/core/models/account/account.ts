import { getDatabase } from "@/core/services/database";

import type { IAccountModels } from "./account.types";
import { isUniqueViolation, toAccount, toLoginKey } from "./account.utils";

const findCredentialsByLogin: IAccountModels["findCredentialsByLogin"] = async (login) => {
  const row = await getDatabase().account.findUnique({
    where: { loginKey: toLoginKey(login) },
  });
  if (!row) return null;
  return {
    account: toAccount(row),
    sessionVersion: row.sessionVersion,
    passwordHash: row.passwordHash,
  };
};

const findById: IAccountModels["findById"] = async (id) => {
  const row = await getDatabase().account.findUnique({
    where: { id },
  });
  if (!row) return null;
  return {
    account: toAccount(row),
    sessionVersion: row.sessionVersion,
  };
};

const listAccounts: IAccountModels["listAccounts"] = async () => {
  const rows = await getDatabase().account.findMany({
    orderBy: [{ role: "desc" }, { loginKey: "asc" }],
  });
  return rows.map(toAccount);
};

const countPlayersByIds: IAccountModels["countPlayersByIds"] = async (ids) =>
  getDatabase().account.count({ where: { id: { in: ids }, role: "PLAYER" } });

const createAccount: IAccountModels["createAccount"] = async ({ login, passwordHash, role }) => {
  try {
    const row = await getDatabase().account.create({
      data: { login: login.trim(), loginKey: toLoginKey(login), passwordHash, role },
    });
    return toAccount(row);
  } catch (error) {
    if (isUniqueViolation(error)) return null;
    throw error;
  }
};

const upsertAccount: IAccountModels["upsertAccount"] = async ({ login, passwordHash, role }) => {
  const loginKey = toLoginKey(login);
  const row = await getDatabase().account.upsert({
    where: { loginKey },
    create: { login: login.trim(), loginKey, passwordHash, role },
    update: { login: login.trim(), passwordHash, role, sessionVersion: { increment: 1 } },
  });
  return toAccount(row);
};

const updatePassword: IAccountModels["updatePassword"] = async (id, passwordHash) => {
  await getDatabase().account.update({
    where: { id },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });
};

const revokeSessions: IAccountModels["revokeSessions"] = async (id) => {
  await getDatabase().account.update({ where: { id }, data: { sessionVersion: { increment: 1 } } });
};

export const accountModels: IAccountModels = {
  findCredentialsByLogin,
  findById,
  listAccounts,
  countPlayersByIds,
  createAccount,
  upsertAccount,
  updatePassword,
  revokeSessions,
};

export { findCredentialsByLogin, findById, upsertAccount, updatePassword, revokeSessions };
