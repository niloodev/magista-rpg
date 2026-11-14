import type { IRollResult } from "@magista/shared";
import { describe, expect, it } from "vitest";

import {
  feedHint,
  parseFeedHint,
  presenceLoadingRows,
  presenceRows,
  splitNotes,
} from "./table.utils";

describe("presenceRows", () => {
  it("usa a contagem guardada, entre 1 e 12", () => {
    expect(presenceRows(3)).toHaveLength(3);
    expect(presenceRows(0)).toHaveLength(1);
    expect(presenceRows(400)).toHaveLength(12);
  });

  it("cai em 1 linha sem dica válida", () => {
    expect(presenceRows(undefined)).toEqual([0]);
    expect(presenceRows("abc")).toEqual([0]);
  });
});

describe("presenceLoadingRows", () => {
  it("só mostra linhas de espera enquanto ninguém chegou e a conexão não caiu", () => {
    expect(presenceLoadingRows("connecting", 0, 2)).toEqual([0, 1]);
    expect(presenceLoadingRows("connected", 0, 2)).toEqual([0, 1]);
    expect(presenceLoadingRows("connected", 1, 2)).toEqual([]);
    expect(presenceLoadingRows("disconnected", 0, 2)).toEqual([]);
  });
});

describe("dica do feed", () => {
  const outcome = (results: number[], sides: number, flat = 0) => ({
    expression: `${results.length}d${sides}`,
    total: 0,
    terms: [
      { kind: "dice", count: results.length, sides, results, sign: 1 },
      ...(flat ? [{ kind: "flat", value: flat, sign: 1 }] : []),
    ],
  });
  const roll = (rows: { label: string; outcome: unknown }[], notes: string[]) =>
    ({
      rows,
      notes,
      characterName: "Zarkov",
      title: "Teste de Força",
      subtitle: "FOR",
    }) as unknown as IRollResult;

  it("guarda linhas (tamanho do rótulo, dados, modificador, natural) e tamanhos de notas, sem texto", () => {
    const hint = feedHint([
      roll([{ label: "Rolagem", outcome: outcome([20], 20, 3) }], ["CD 10", "x".repeat(200)]),
      roll([{ label: "Dano", outcome: outcome([1, 2, 3], 6) }], []),
    ]);
    expect(hint).toEqual({
      n: 2,
      c: [
        [[[12, 1, 3, 10]], [5], [200], 2, [6, 14, 3]],
        [[[8, 3, 0, 0]], [], [], 0, [6, 14, 3]],
      ],
    });
    expect(JSON.stringify(hint)).not.toMatch(/CD 10|Rolagem|Dano|Zarkov|Força/);
    expect(parseFeedHint(hint)?.cards[1]).toEqual({
      name: 6,
      title: 14,
      subtitle: 3,
      byGm: false,
      critical: false,
      levelUp: false,
      rows: [{ label: 8, chips: 3, modifier: 0, natural: 0 }],
      short: [],
      long: [],
    });
  });

  it("ignora dica malformada e limita valores", () => {
    expect(parseFeedHint(null)).toBeNull();
    expect(parseFeedHint([1])).toBeNull();
    expect(
      parseFeedHint({ n: 9999, c: [[[[9999, 999, -1, "x"]], [0, 9999], "x"], "y", [[], [], []]] }),
    ).toEqual({
      count: 50,
      cards: [
        {
          name: 10,
          title: 16,
          subtitle: 0,
          byGm: false,
          critical: false,
          levelUp: false,
          rows: [{ label: 600, chips: 40, modifier: 0, natural: 0 }],
          short: [1, 600],
          long: [],
        },
      ],
    });
  });

  it("separa notas curtas das longas", () => {
    expect(splitNotes(["curta", "a\nb", "y".repeat(161)])).toEqual({
      short: ["curta"],
      long: ["a\nb", "y".repeat(161)],
    });
  });
});
