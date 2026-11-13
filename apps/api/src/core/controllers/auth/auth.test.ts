import { describe, expect, it, vi } from "vitest";

import type { IAccountModels } from "@/core/models/account";

import { createAuthController } from "./auth";
import { authErrors } from "./auth.errors";

const credentials = {
  account: { id: "acc-1", login: "Zarkov", role: "PLAYER" as const },
  character: { id: "char-1", name: "Zarkov" },
  passwordHash: "hash",
};

function buildController(overrides: Partial<IAccountModels> = {}, passwordOk = true) {
  const accounts: IAccountModels = {
    findCredentialsByLogin: vi.fn().mockResolvedValue(credentials),
    findById: vi.fn().mockResolvedValue({
      account: credentials.account,
      character: credentials.character,
    }),
    upsertAccount: vi.fn(),
    ...overrides,
  };
  return createAuthController({
    accounts,
    verifyPassword: vi.fn().mockResolvedValue(passwordOk),
    signToken: vi.fn().mockReturnValue("token"),
  });
}

describe("auth controller", () => {
  it("rejects empty input", async () => {
    const result = await buildController().login({ login: " ", password: "" });
    expect(result).toEqual({ error: authErrors.invalidInput });
  });

  it("rejects unknown login", async () => {
    const controller = buildController({ findCredentialsByLogin: vi.fn().mockResolvedValue(null) });
    const result = await controller.login({ login: "ninguem", password: "x" });
    expect(result).toEqual({ error: authErrors.invalidCredentials });
  });

  it("rejects a wrong password", async () => {
    const result = await buildController({}, false).login({ login: "Zarkov", password: "x" });
    expect(result).toEqual({ error: authErrors.invalidCredentials });
  });

  it("returns the session and token without the password hash", async () => {
    const result = await buildController().login({ login: "Zarkov", password: "certa" });
    expect(result).toEqual({
      message: expect.any(String),
      payload: {
        session: { account: credentials.account, character: credentials.character },
        token: "token",
      },
    });
  });

  it("maps a database failure to the unexpected error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const controller = buildController({
      findCredentialsByLogin: vi.fn().mockRejectedValue(new Error("db down")),
    });
    const result = await controller.login({ login: "Zarkov", password: "x" });
    expect(result).toEqual({ error: authErrors.unexpected });
  });
});
