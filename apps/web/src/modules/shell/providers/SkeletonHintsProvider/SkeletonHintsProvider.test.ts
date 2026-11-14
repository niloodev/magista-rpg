import { describe, expect, it } from "vitest";

import { fitHints, parseHints, serializeHints } from "./SkeletonHintsProvider.utils";

describe("dicas de skeleton (cookie)", () => {
  it("ida e volta pelo valor do cookie", () => {
    const hints = { s: { r: "GM", l: 6 }, p: 2 };
    expect(parseHints(serializeHints(hints))).toEqual(hints);
  });

  it("valor ausente ou malformado vira registro vazio", () => {
    for (const raw of [null, undefined, "", "%%%", "bmFvLWpzb24", btoa("[1,2]")])
      expect(parseHints(raw)).toEqual({});
  });

  it("recusa um registro grande demais ou que não cabe no cookie", () => {
    expect(serializeHints({ l: "x".repeat(5000) })).toBeNull();
    expect(serializeHints({ n: "名前" })).toBeNull();
  });

  it("gera só caracteres seguros para cookie", () => {
    expect(serializeHints({ s: { r: "GM", l: 63 }, l: [[1, 2, 3, [4]]] })).toMatch(
      /^[A-Za-z0-9_-]+$/,
    );
  });

  it("ignora um cookie maior que o limite, sem tentar ler", () => {
    expect(parseHints("A".repeat(3001))).toEqual({});
  });

  it("se não cabe, descarta primeiro a maior das outras partes e mantém a que está sendo gravada", () => {
    const fitted = fitHints({ l: "x".repeat(2400), s: { r: "GM", l: 6 }, f: "y".repeat(600) }, "f");
    expect(Object.keys(fitted.hints).sort()).toEqual(["f", "s"]);
    expect(fitted.value).not.toBeNull();
  });

  it("descarta a própria parte só quando ela sozinha não cabe", () => {
    const fitted = fitHints({ s: { r: "GM", l: 6 }, l: "x".repeat(5000) }, "l");
    expect(fitted.hints).toEqual({ s: { r: "GM", l: 6 } });
  });
});
