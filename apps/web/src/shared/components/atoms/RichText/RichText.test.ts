import { describe, expect, it } from "vitest";

import { toParagraphs, toSegments } from "./RichText.utils";

describe("RichText utils", () => {
  it("splits **bold** markers into segments", () => {
    expect(toSegments("**Efeitos** Imunidade a **veneno**.")).toEqual([
      { text: "Efeitos", bold: true },
      { text: " Imunidade a ", bold: false },
      { text: "veneno", bold: true },
      { text: ".", bold: false },
    ]);
  });

  it("keeps unbalanced or empty markers as plain text", () => {
    expect(toSegments("2 ** 3")).toEqual([{ text: "2 ** 3", bold: false }]);
    expect(toSegments("****")).toEqual([{ text: "****", bold: false }]);
  });

  it("splits paragraphs on blank lines and keeps single line breaks", () => {
    expect(toParagraphs("a\nb\r\n\r\nc\n\n\n")).toEqual([["a", "b"], ["c"]]);
  });
});
