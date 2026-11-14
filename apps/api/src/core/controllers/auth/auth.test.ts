import { describe, expect, it, vi } from "vitest";

import { createAuthController } from "./auth";
import { authErrors } from "./auth.errors";
import type { IAuthControllerDeps } from "./auth.types";

const account = { id: "acc-1", login: "Zarkov", role: "PLAYER" as const };
const credentials = { account, sessionVersion: 3, passwordHash: "hash" };

const QUICK_LOGINS = { GM: "Mestre", PLAYER: "Zarkov" };
const LOCAL_IP = "127.0.0.1";

function build(
  overrides: Partial<IAuthControllerDeps["accounts"]> = {},
  passwordOk = true,
  quickLogins: Record<"GM" | "PLAYER", string> | null = QUICK_LOGINS,
) {
  const deps: IAuthControllerDeps = {
    accounts: {
      findCredentialsByLogin: vi.fn().mockResolvedValue(credentials),
      findById: vi.fn().mockResolvedValue({ account, sessionVersion: 3 }),
      revokeSessions: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    },
    verifyPassword: vi.fn().mockResolvedValue(passwordOk),
    verifyAgainstDummy: vi.fn().mockResolvedValue(false),
    signToken: vi.fn().mockReturnValue("token"),
    quickLogins: () => quickLogins,
  };
  return { deps, controller: createAuthController(deps) };
}

describe("auth controller quick login", () => {
  it("is refused when the flag is off", async () => {
    const { controller, deps } = build({}, true, null);
    expect(await controller.quickLogin({ role: "PLAYER" }, LOCAL_IP)).toEqual({
      error: authErrors.quickLoginDisabled,
    });
    expect(deps.accounts.findCredentialsByLogin).not.toHaveBeenCalled();
  });

  it("is refused for requests that do not come from this machine", async () => {
    const { controller, deps } = build();
    for (const ip of ["192.168.0.10", "10.0.0.2", undefined]) {
      expect(await controller.quickLogin({ role: "GM" }, ip)).toEqual({
        error: authErrors.quickLoginDisabled,
      });
    }
    expect(deps.accounts.findCredentialsByLogin).not.toHaveBeenCalled();
    expect(await controller.quickLogin({ role: "PLAYER" }, "::ffff:127.0.0.1")).toMatchObject({
      payload: { token: "token" },
    });
  });

  it("signs in the seed account of the requested role without a password", async () => {
    const { controller, deps } = build();
    const result = await controller.quickLogin({ role: "PLAYER" }, LOCAL_IP);
    expect(deps.accounts.findCredentialsByLogin).toHaveBeenCalledWith("Zarkov");
    expect(deps.verifyPassword).not.toHaveBeenCalled();
    expect(result).toMatchObject({ payload: { token: "token", session: { account } } });
  });

  it("refuses when the configured login has another role or does not exist", async () => {
    expect(await build().controller.quickLogin({ role: "GM" }, LOCAL_IP)).toEqual({
      error: authErrors.quickLoginMissing,
    });
    const missing = build({ findCredentialsByLogin: vi.fn().mockResolvedValue(null) });
    expect(await missing.controller.quickLogin({ role: "PLAYER" }, LOCAL_IP)).toEqual({
      error: authErrors.quickLoginMissing,
    });
  });

  it("rejects unknown roles", async () => {
    expect(await build().controller.quickLogin({ role: "ADMIN" }, LOCAL_IP)).toEqual({
      error: authErrors.invalidInput,
    });
  });
});

describe("auth controller", () => {
  it("rejects empty input", async () => {
    expect(await build().controller.login({ login: " ", password: "" })).toEqual({
      error: authErrors.invalidInput,
    });
  });

  it("rejects unknown logins after spending the same hashing time", async () => {
    const { controller, deps } = build({ findCredentialsByLogin: vi.fn().mockResolvedValue(null) });
    expect(await controller.login({ login: "ninguem", password: "x" })).toEqual({
      error: authErrors.invalidCredentials,
    });
    expect(deps.verifyAgainstDummy).toHaveBeenCalledWith("x");
  });

  it("rejects a wrong password", async () => {
    expect(await build({}, false).controller.login({ login: "Zarkov", password: "x" })).toEqual({
      error: authErrors.invalidCredentials,
    });
  });

  it("signs the session version into the token and never returns the hash", async () => {
    const { controller, deps } = build();
    const result = await controller.login({ login: "Zarkov", password: "certa" });
    expect(result).toEqual({
      message: expect.any(String),
      payload: { session: { account }, token: "token" },
    });
    expect(deps.signToken).toHaveBeenCalledWith({ sub: "acc-1", ver: 3 });
  });

  it("authenticates only tokens with the current session version", async () => {
    const { controller } = build();
    expect(await controller.authenticate({ sub: "acc-1", ver: 3 })).toMatchObject({
      payload: { accountId: "acc-1", role: "PLAYER", session: { account } },
    });
    expect(await controller.authenticate({ sub: "acc-1", ver: 2 })).toEqual({
      error: authErrors.sessionNotFound,
    });
  });

  it("rejects tokens of deleted accounts", async () => {
    const { controller } = build({ findById: vi.fn().mockResolvedValue(null) });
    expect(await controller.authenticate({ sub: "acc-1", ver: 3 })).toEqual({
      error: authErrors.sessionNotFound,
    });
  });

  it("revokes every session on logout", async () => {
    const { controller, deps } = build();
    expect(await controller.logout("acc-1")).toMatchObject({ payload: null });
    expect(deps.accounts.revokeSessions).toHaveBeenCalledWith("acc-1");
  });

  it("maps a database failure to the unexpected error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { controller } = build({
      findCredentialsByLogin: vi.fn().mockRejectedValue(new Error("db down")),
    });
    expect(await controller.login({ login: "Zarkov", password: "x" })).toEqual({
      error: authErrors.unexpected,
    });
  });
});
