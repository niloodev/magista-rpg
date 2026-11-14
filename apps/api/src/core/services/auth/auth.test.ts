import jwt from "jsonwebtoken";
import { beforeAll, describe, expect, it } from "vitest";

import {
  hashPassword,
  signSessionToken,
  verifyAgainstDummy,
  verifyPassword,
  verifySessionToken,
} from "./auth";

beforeAll(() => {
  process.env.DATABASE_URL = "postgresql://test";
  process.env.JWT_SECRET = "x".repeat(40);
});

describe("auth service", () => {
  it("round-trips session tokens", () => {
    const token = signSessionToken({ sub: "acc", ver: 2 });
    expect(verifySessionToken(token)).toEqual({ sub: "acc", ver: 2 });
  });

  it("rejects tampered, foreign-secret and alg:none tokens", () => {
    const token = signSessionToken({ sub: "acc", ver: 0 });
    expect(verifySessionToken(`${token}x`)).toBeNull();
    expect(verifySessionToken(jwt.sign({ sub: "acc", ver: 0 }, "y".repeat(40)))).toBeNull();
    const none = jwt.sign({ sub: "acc", ver: 0 }, "", { algorithm: "none" });
    expect(verifySessionToken(none)).toBeNull();
  });

  it("hashes and verifies passwords; the dummy check always fails", async () => {
    const hash = await hashPassword("segredo");
    expect(hash).not.toContain("segredo");
    expect(await verifyPassword(hash, "segredo")).toBe(true);
    expect(await verifyPassword(hash, "errado")).toBe(false);
    expect(await verifyAgainstDummy("qualquer")).toBe(false);
  });
});
