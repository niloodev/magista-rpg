import { describe, expect, it } from "vitest";

import { isErrorResult } from "./envelope";

describe("isErrorResult", () => {
  it("detects the error branch", () => {
    expect(isErrorResult({ error: "falhou" })).toBe(true);
    expect(isErrorResult({ message: "ok", payload: 1 })).toBe(false);
  });
});
