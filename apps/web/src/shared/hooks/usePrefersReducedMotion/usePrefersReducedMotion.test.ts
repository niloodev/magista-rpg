import { afterEach, describe, expect, it, vi } from "vitest";

import { parsePerfMode, prefersReducedMotion } from "./usePrefersReducedMotion.utils";

function stubDom(attribute: string | null, systemReduced: boolean) {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: systemReduced }) });
  vi.stubGlobal("document", { documentElement: { getAttribute: () => attribute } });
}

describe("prefersReducedMotion", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads only the known modes", () => {
    expect(parsePerfMode("low")).toBe("low");
    expect(parsePerfMode("full")).toBe("full");
    expect(parsePerfMode("turbo")).toBeNull();
    expect(parsePerfMode(undefined)).toBeNull();
  });

  it("lets the chosen mode win over the system setting", () => {
    stubDom("low", false);
    expect(prefersReducedMotion()).toBe(true);
    stubDom("full", true);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("follows the system when nothing was chosen", () => {
    stubDom(null, true);
    expect(prefersReducedMotion()).toBe(true);
    stubDom(null, false);
    expect(prefersReducedMotion()).toBe(false);
  });
});
