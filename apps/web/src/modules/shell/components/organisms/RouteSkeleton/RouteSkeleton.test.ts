import { describe, expect, it } from "vitest";

import { sessionHint } from "@/modules/shell/providers";

import { parseSessionHint } from "./RouteSkeleton.utils";

describe("dica de sessão", () => {
  it("guarda papel e tamanho do login, nunca o login", () => {
    expect(sessionHint("GM", "mestre")).toEqual({ r: "GM", l: 6 });
    expect(JSON.stringify(sessionHint("PLAYER", "zarkov"))).not.toContain("zarkov");
  });

  it("lê a dica guardada", () => {
    expect(parseSessionHint({ r: "GM", l: 6 })).toEqual({ known: true, gm: true, loginLength: 6 });
    expect(parseSessionHint({ r: "PLAYER", l: 12 })).toEqual({
      known: true,
      gm: false,
      loginLength: 12,
    });
  });

  it("sem dica válida não afirma papel", () => {
    for (const value of [null, undefined, "x", 42, { r: 1 }, []])
      expect(parseSessionHint(value)).toEqual({ known: false, gm: false, loginLength: 10 });
  });

  it("limita o tamanho do login", () => {
    expect(parseSessionHint({ r: "GM", l: 1e9 }).loginLength).toBe(64);
    expect(parseSessionHint({ r: "GM", l: Number.POSITIVE_INFINITY }).loginLength).toBe(10);
    expect(parseSessionHint({ r: "GM", l: -4 }).loginLength).toBe(1);
  });
});
