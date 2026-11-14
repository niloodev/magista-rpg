import type { ICharacterSummary, IFolder } from "@magista/shared";
import { describe, expect, it } from "vitest";

import {
  applyMove,
  charactersIn,
  countCharactersDeep,
  dropPositionFor,
  moveForDrop,
  folderPathLabel,
  fromDragId,
  libraryShape,
  parseLibraryShape,
  searchCharacters,
  toDragId,
} from "./library.utils";

const character = (id: string, name: string, folderId: string | null, position: number) =>
  ({
    id,
    name,
    folderId,
    position,
    avatarUrl: null,
    tokenUrl: null,
    classKey: "arcanista",
    level: 3,
    accountIds: [],
  }) satisfies ICharacterSummary;

const folders: IFolder[] = [
  { id: "f1", name: "Campanha", parentId: null, position: 0 },
  { id: "f2", name: "NPCs", parentId: "f1", position: 0 },
  { id: "f3", name: "Arquivo", parentId: null, position: 1 },
];

const data = {
  folders,
  characters: [
    character("a", "Kael", null, 0),
    character("b", "Lyra", null, 1),
    character("c", "Óton", "f2", 0),
    character("d", "Brisa", "f1", 0),
  ],
};

describe("library utils", () => {
  it("lists and counts characters per folder", () => {
    expect(charactersIn(data.characters, null).map((c) => c.id)).toEqual(["a", "b"]);
    expect(countCharactersDeep(data, "f1")).toBe(2);
    expect(countCharactersDeep(data, "f3")).toBe(0);
  });

  it("searches across folders with paths, ignoring accents", () => {
    expect(searchCharacters(data, "oton")).toEqual([
      { character: data.characters[2], path: "Campanha / NPCs" },
    ]);
    expect(folderPathLabel(folders, null)).toBe("Todas as fichas");
  });

  it("reorders characters inside a folder", () => {
    const next = applyMove(data, { kind: "character", id: "b", parentId: null, index: 0 });
    expect(charactersIn(next.characters, null).map((c) => c.id)).toEqual(["b", "a"]);
  });

  it("moves a character into another folder and closes the gap it left", () => {
    const next = applyMove(data, { kind: "character", id: "a", parentId: "f1", index: 0 });
    expect(charactersIn(next.characters, "f1").map((c) => c.id)).toEqual(["a", "d"]);
    expect(charactersIn(next.characters, null).map((c) => [c.id, c.position])).toEqual([["b", 0]]);
  });

  it("moves folders between parents", () => {
    const next = applyMove(data, { kind: "folder", id: "f2", parentId: null, index: 1 });
    expect(
      next.folders
        .filter((f) => f.parentId === null)
        .sort((a, b) => a.position - b.position)
        .map((f) => f.id),
    ).toEqual(["f1", "f2", "f3"]);
  });

  it("round-trips drag ids", () => {
    expect(fromDragId(toDragId({ kind: "folder", id: "x:y" }))).toEqual({
      kind: "folder",
      id: "x:y",
    });
  });

  it("decides before, after or inside from the pointer position in the row", () => {
    expect(dropPositionFor("character", "folder", 0.05)).toBe("inside");
    expect(dropPositionFor("folder", "folder", 0.1)).toBe("before");
    expect(dropPositionFor("folder", "folder", 0.5)).toBe("inside");
    expect(dropPositionFor("folder", "folder", 0.9)).toBe("after");
    expect(dropPositionFor("character", "character", 0.2)).toBe("before");
    expect(dropPositionFor("character", "character", 0.8)).toBe("after");
    expect(dropPositionFor("folder", "character", 0.5)).toBeNull();
    expect(dropPositionFor("folder", "root", 0.5)).toBe("inside");
  });

  it("builds moves for drops inside folders and on the root", () => {
    expect(
      moveForDrop(data, { kind: "character", id: "a" }, { kind: "folder", id: "f2" }, "inside"),
    ).toEqual({
      kind: "character",
      id: "a",
      parentId: "f2",
      index: 1,
    });
    expect(
      moveForDrop(data, { kind: "character", id: "c" }, { kind: "root", id: "root" }, "inside"),
    ).toEqual({
      kind: "character",
      id: "c",
      parentId: null,
      index: 2,
    });
    expect(
      moveForDrop(data, { kind: "character", id: "a" }, { kind: "root", id: "root" }, "inside"),
    ).toBeNull();
  });

  it("reorders before and after siblings, across folders too", () => {
    expect(
      moveForDrop(data, { kind: "character", id: "a" }, { kind: "character", id: "b" }, "after"),
    ).toEqual({
      kind: "character",
      id: "a",
      parentId: null,
      index: 1,
    });
    expect(
      moveForDrop(data, { kind: "character", id: "a" }, { kind: "character", id: "b" }, "before"),
    ).toBeNull();
    expect(
      moveForDrop(data, { kind: "character", id: "c" }, { kind: "character", id: "a" }, "before"),
    ).toEqual({
      kind: "character",
      id: "c",
      parentId: null,
      index: 0,
    });
    expect(
      moveForDrop(data, { kind: "folder", id: "f3" }, { kind: "folder", id: "f1" }, "before"),
    ).toEqual({
      kind: "folder",
      id: "f3",
      parentId: null,
      index: 0,
    });
  });

  it("never puts a folder inside itself or its descendants", () => {
    expect(
      moveForDrop(data, { kind: "folder", id: "f1" }, { kind: "folder", id: "f2" }, "inside"),
    ).toBeNull();
    expect(
      moveForDrop(data, { kind: "folder", id: "f1" }, { kind: "folder", id: "f1" }, "inside"),
    ).toBeNull();
    expect(
      moveForDrop(data, { kind: "folder", id: "f3" }, { kind: "folder", id: "f2" }, "inside"),
    ).toEqual({
      kind: "folder",
      id: "f3",
      parentId: "f2",
      index: 0,
    });
  });
});

describe("libraryShape (dica do cookie)", () => {
  const logins = new Map([
    ["p1", "ana"],
    ["p2", "bruno"],
  ]);
  const withAccess = {
    ...data,
    characters: data.characters.map((item) =>
      item.id === "a" ? { ...item, accountIds: ["p1", "p2", "fora"] } : item,
    ),
  };

  it("guarda a árvore do Mestre só com tamanhos e números, sem texto pessoal nem ids", () => {
    const hint = libraryShape(withAccess, ["f1"], logins, true);
    expect(hint).toEqual({
      t: [
        [
          -8,
          2,
          1,
          [
            [-4, 1, 0, 0],
            [5, 1, 3, []],
          ],
        ],
        [-7, 0, 0, 0],
        [4, 1, 3, [3, 5]],
        [4, 1, 3, []],
      ],
    });
    expect(JSON.stringify(hint)).not.toMatch(/Kael|Campanha|ana|bruno|f1|Arcanista/);
  });

  it("para o jogador guarda só a lista, em ordem alfabética", () => {
    expect(libraryShape(withAccess, [], logins, false)).toEqual({
      p: [
        [5, 1, 3],
        [4, 1, 3],
        [4, 1, 3],
        [4, 1, 3],
      ],
    });
  });

  it("volta a ser as linhas que o skeleton desenha, com textos de jogo reconstruídos", () => {
    const shape = parseLibraryShape(libraryShape(withAccess, ["f1"], logins, true));
    expect(shape?.tree[0]).toEqual({
      kind: "folder",
      name: 8,
      summary: "2 fichas · 1 pasta",
      children: [
        { kind: "folder", name: 4, summary: "1 ficha", children: null },
        { kind: "character", name: 5, subtitle: "Arcanista · Nível 3", access: [] },
      ],
    });
    expect(shape?.tree[2]).toEqual({
      kind: "character",
      name: 4,
      subtitle: "Arcanista · Nível 3",
      access: [3, 5],
    });
    expect(parseLibraryShape(libraryShape(withAccess, [], logins, false))?.list[0]).toEqual({
      name: 5,
      subtitle: "Arcanista · Nível 3",
    });
  });

  it("limita linhas e tamanhos guardados", () => {
    const many = {
      folders: [],
      characters: Array.from({ length: 60 }, (_, index) =>
        character(`c${index}`, "N".repeat(90), null, index),
      ),
    };
    const hint = libraryShape(many, [], new Map(), true);
    expect(hint.t).toHaveLength(40);
    expect(hint.t?.[0]?.[0]).toBe(40);
  });
});

describe("parseLibraryShape", () => {
  it("ignora conteúdo inválido e corta valores fora da faixa", () => {
    for (const value of [null, undefined, "x", 42, [1, 2]])
      expect(parseLibraryShape(value)).toBeNull();
    expect(
      parseLibraryShape({
        p: [[999, 77, 500], "x"],
        t: [[-3, -1, 5000, "nada"], ["x"], [2, "a", 0, [500, "b"]]],
      }),
    ).toEqual({
      list: [{ name: 40, subtitle: "Trilhador · Nível 99" }],
      tree: [
        { kind: "folder", name: 3, summary: "0 fichas · 999 pastas", children: null },
        { kind: "character", name: 2, subtitle: "Sem Classe · Nível 1", access: [40, 1] },
      ],
    });
  });

  it("não deixa uma árvore gigante passar do limite de linhas", () => {
    const deep: unknown[] = [-3, 0, 1, []];
    let cursor = deep;
    for (let index = 0; index < 100; index += 1) {
      const next: unknown[] = [-3, 0, 1, []];
      (cursor[3] as unknown[]).push(next);
      cursor = next;
    }
    const parsed = parseLibraryShape({ t: [deep] });
    type Counted = { children?: Counted[] | null };
    const count = (nodes: Counted[]): number =>
      nodes.reduce<number>(
        (total, node) => total + 1 + (node.children ? count(node.children) : 0),
        0,
      );
    expect(count((parsed?.tree ?? []) as Counted[])).toBeLessThanOrEqual(40);
  });
});
