import { describe, expect, it, vi } from "vitest";

import { createAccountController } from "./account";
import { accountErrors } from "./account.errors";

const found = {
  account: { id: "a", login: "Kael Magnus", role: "PLAYER" as const },
  passwordHash: "x",
};

function build(account: unknown = found) {
  const deps = {
    accounts: {
      findCredentialsByLogin: vi.fn().mockResolvedValue(account),
      updatePassword: vi.fn().mockResolvedValue(undefined),
      listAccounts: vi.fn().mockResolvedValue([found.account]),
      createAccount: vi
        .fn()
        .mockImplementation(async ({ login, role }) => ({ id: "new", login, role })),
    },
    hashPassword: vi.fn().mockResolvedValue("hash"),
    generatePassword: () => "gerada1234",
  };
  return { deps, controller: createAccountController(deps) };
}

describe("account controller", () => {
  it("generates a password when none is given", async () => {
    const { controller, deps } = build();
    expect(await controller.setPassword({ login: "kael magnus" })).toMatchObject({
      payload: { login: "Kael Magnus", password: "gerada1234" },
    });
    expect(deps.accounts.updatePassword).toHaveBeenCalledWith("a", "hash");
  });

  it("rejects short passwords and unknown logins", async () => {
    expect(await build().controller.setPassword({ login: "x", password: "123" })).toEqual({
      error: accountErrors.invalidInput,
    });
    expect(await build(null).controller.setPassword({ login: "x" })).toEqual({
      error: accountErrors.notFound,
    });
  });

  it("lets only the GM list and create player accounts", async () => {
    const gm = { accountId: "gm", role: "GM" as const };
    const player = { accountId: "p", role: "PLAYER" as const };
    expect(await build(null).controller.listAccounts(player)).toEqual({
      error: accountErrors.gmOnly,
    });
    expect(await build(null).controller.createAccount(player, { login: "Lyra" })).toEqual({
      error: accountErrors.gmOnly,
    });
    const { controller, deps } = build(null);
    expect(await controller.createAccount(gm, { login: " Lyra " })).toEqual({
      message: "Conta criada",
      payload: { account: { id: "new", login: "Lyra", role: "PLAYER" }, password: "gerada1234" },
    });
    expect(deps.accounts.createAccount).toHaveBeenCalledWith({
      login: "Lyra",
      passwordHash: "hash",
      role: "PLAYER",
    });
    expect(await controller.createAccount(gm, { login: "L", password: "curta" })).toEqual({
      error: accountErrors.invalidNewAccount,
    });
  });

  it("refuses duplicated logins", async () => {
    const gm = { accountId: "gm", role: "GM" as const };
    expect(await build().controller.createAccount(gm, { login: "kael magnus" })).toEqual({
      error: accountErrors.loginTaken,
    });
  });

  it("reports a login taken by a concurrent creation as loginTaken", async () => {
    const gm = { accountId: "gm", role: "GM" as const };
    const { controller, deps } = build(null);
    deps.accounts.createAccount = vi.fn().mockResolvedValue(null);
    expect(await controller.createAccount(gm, { login: "Lyra" })).toEqual({
      error: accountErrors.loginTaken,
    });
  });
});
