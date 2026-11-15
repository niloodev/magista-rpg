import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  boardOf,
  claimName,
  fitName,
  folderNameFor,
  folderTree,
  parseArgs,
  parseFolderNames,
  parsePage,
  pickMapGraphic,
  uniqueSceneNames,
} from "./importRoll20Pages.utils";

const page = (dir: string, name: string, path: string, extra: Record<string, unknown> = {}) =>
  parsePage(dir, { name, path, width: 25, height: 20, graphics: [], ...extra })!;

describe("importRoll20Pages utils", () => {
  it("reads the arguments", () => {
    const options = parseArgs(
      ["pages", "--only", "2, 12", "--folder", "Campanha", "--force"],
      "/home",
      join,
    );
    expect(options).toMatchObject({ root: "/home/pages", rootFolder: "Campanha", force: true });
    expect([...(options.only ?? [])]).toEqual([2, 12]);
    expect(parseArgs(["pages"], "/home", join)).toMatchObject({ rootFolder: "Roll20", only: null });
    expect(() => parseArgs(["--force"], "/home", join)).toThrow("Uso:");
  });

  it("picks the largest image of the map layer", () => {
    expect(
      pickMapGraphic([
        { id: "tiny", layer: "map", width: 42, height: 42 },
        { id: "token", layer: "objects", width: 9000, height: 9000 },
        { id: "map", layer: "map", width: 4096, height: 3072 },
      ]),
    ).toEqual({ id: "map", width: 4096, height: 3072 });
    expect(pickMapGraphic([{ id: "x", layer: "objects", width: 70, height: 70 }])).toBeNull();
  });

  it("parses a page with its folder path and number", () => {
    expect(page("002 - Vale do Mel", " Vale  do Mel ", ",a,b,")).toMatchObject({
      index: 2,
      name: "Vale do Mel",
      folderPath: ["a", "b"],
      map: null,
    });
    expect(parsePage("x", { name: "" })).toBeNull();
  });

  it("names folders after what their pages share, a chosen name winning", () => {
    const pages = [
      page("001", "Vale do Mel", ",a,b,"),
      page("002", "Vale do Mel - Taverna (Dia)", ",a,b,"),
      page("003", "Interlúdio (Dia)", ",a,"),
      page("004", "Derose - Mapa", ",a,c,"),
    ];
    expect(folderNameFor("b", 2, pages, {})).toBe("Vale do Mel");
    expect(folderNameFor("c", 3, pages, {})).toBe("Derose - Mapa");
    expect(folderNameFor("a", 1, pages, {})).toBe("Pasta 1 (Vale do Mel)");
    expect(folderNameFor("a", 1, pages, { a: " Arco 1 " })).toBe("Arco 1");
    expect(folderTree(pages, {})).toEqual([
      { id: "a", name: "Pasta 1 (Vale do Mel)", parentId: null },
      { id: "b", name: "Vale do Mel", parentId: "a" },
      { id: "c", name: "Derose - Mapa", parentId: "a" },
    ]);
  });

  it("numbers repeated scene names inside the same folder", () => {
    const first = page("003", "Interlúdio (Dia)", ",a,");
    const other = page("010", "Interlúdio (Dia)", ",b,");
    const again = page("040", "Interlúdio (Dia)", ",a,");
    const names = uniqueSceneNames([first, other, again]);
    expect([names.get(first), names.get(other), names.get(again)]).toEqual([
      "Interlúdio (Dia)",
      "Interlúdio (Dia)",
      "Interlúdio (Dia) (2)",
    ]);
  });

  it("sizes the board like the Roll20 page", () => {
    const mapped = page("002", "Vale", ",", {
      graphics: [{ id: "m", layer: "map", width: 4096, height: 3072 }],
    });
    expect(boardOf(mapped)).toEqual({ width: 4096 });
    expect(boardOf(page("079", "Pós Vida", ","))).toEqual({ width: 1750, height: 1400 });
  });

  it("keeps names within 60 characters and unique without case", () => {
    const long = "x".repeat(70);
    expect(fitName(long)).toHaveLength(60);
    expect(fitName(long, " (2)")).toMatch(/^x{56} \(2\)$/);
    const taken = new Set(["mapa (2)"]);
    expect(claimName("Mapa", taken)).toBe("Mapa");
    expect(claimName("MAPA", taken)).toBe("MAPA (3)");
  });

  it("gives sibling folders that would share a name their own names", () => {
    const pages = [page("001", "Derose", ",r,a,"), page("002", "Derose", ",r,b,")];
    expect(folderTree(pages, {}).map((folder) => folder.name)).toEqual([
      "Derose",
      "Derose",
      "Derose (2)",
    ]);
  });

  it("keeps only text folder names", () => {
    expect(parseFolderNames({ a: " Arco ", b: 3, c: "" })).toEqual({ a: "Arco" });
    expect(parseFolderNames(null)).toEqual({});
  });
});
