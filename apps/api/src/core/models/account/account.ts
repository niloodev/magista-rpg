import { getDatabase } from "@/core/services/database";

import type { IAccountModels } from "./account.types";
import { toAccount, toCharacterSummary, toLoginKey } from "./account.utils";

const findCredentialsByLogin: IAccountModels["findCredentialsByLogin"] = async (login) => {
  const row = await getDatabase().account.findUnique({
    where: { loginKey: toLoginKey(login) },
    include: { character: true },
  });
  if (!row) return null;
  return {
    account: toAccount(row),
    character: toCharacterSummary(row.character),
    passwordHash: row.passwordHash,
  };
};

const findById: IAccountModels["findById"] = async (id) => {
  const row = await getDatabase().account.findUnique({
    where: { id },
    include: { character: true },
  });
  if (!row) return null;
  return { account: toAccount(row), character: toCharacterSummary(row.character) };
};

const upsertAccount: IAccountModels["upsertAccount"] = async ({ login, passwordHash, role }) => {
  const loginKey = toLoginKey(login);
  const row = await getDatabase().account.upsert({
    where: { loginKey },
    create: { login: login.trim(), loginKey, passwordHash, role },
    update: { login: login.trim(), passwordHash, role },
  });
  return toAccount(row);
};

export const accountModels: IAccountModels = { findCredentialsByLogin, findById, upsertAccount };

export { findCredentialsByLogin, findById, upsertAccount };
