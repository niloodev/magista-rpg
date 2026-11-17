import { createEmptySheet, type ICharacter } from "@magista/shared";
import { describe, expect, it, vi } from "vitest";

import { createRollController } from "./roll";
import { rollErrors } from "./roll.errors";

const sheet = createEmptySheet();
sheet.attributes.des.value = 14;
sheet.abilities = [
  {
    id: "bad",
    name: "Quebrada",
    attackAttribute: null,
    damageDice: "1d12 + FOR",
    damageFlat: 0,
    damageAttribute: null,
    addBaseDamage: false,
    addProficiency: false,
    description: "",
  },
  {
    id: "golpe",
    name: "Golpe",
    attackAttribute: null,
    damageDice: "2d6",
    damageFlat: 1,
    damageAttribute: null,
    addBaseDamage: false,
    addProficiency: false,
    description: "",
  },
];
sheet.traits = [{ id: "t1", name: "Visão no escuro", description: "Enxerga no escuro." }];
sheet.inventory.items = [
  { id: "i1", name: "Escudo", quantity: 1, armorBonus: 2, weightGrams: 1500, description: "" },
];

const character: ICharacter = {
  id: "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90",
  name: "Kael",
  avatarUrl: null,
  artUrl: null,
  avatarThumbUrl: null,
  artThumbUrl: null,
  figureUrl: null,
  figureThumbUrl: null,
  tokenStyle: "portrait" as const,
  showTokenName: true,
  sheet,
  sheetVersion: 1,
  features: [],
  updatedAt: new Date(0).toISOString(),
};

const controllerDeps = {
  characters: {
    findById: vi.fn().mockResolvedValue(character),
    updateSheet: vi.fn().mockImplementation(async (_id, next) => ({ ...character, sheet: next })),
    hasAccess: vi.fn().mockImplementation(async (_id, accountId) => accountId === "owner"),
  },
  randomInt: (_min, max) => max,
  createId: () => "roll-1",
  now: () => new Date(0),
} satisfies Parameters<typeof createRollController>[0];

const controller = createRollController(controllerDeps);

const owner = { accountId: "owner", role: "PLAYER" as const };

describe("roll controller", () => {
  it("rolls a sheet initiative once per token, each for its own token", async () => {
    const results = await controller.rollInitiatives(owner, character.id, ["t-a", "t-b"]);
    expect(results.map((result) => [result.kind, result.tokenId])).toEqual([
      ["initiative", "t-a"],
      ["initiative", "t-b"],
    ]);
    expect(results[0]?.rows[0]?.outcome.total).toBe(22);
    expect(
      await controller.rollInitiatives({ accountId: "stranger", role: "PLAYER" }, character.id, [
        "t-a",
      ]),
    ).toEqual([]);
  });

  it("rolls initiative from the stored sheet", async () => {
    const result = await controller.roll(owner, {
      characterId: "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90",
      roll: { kind: "initiative" },
    });
    expect(result).toMatchObject({
      payload: {
        id: "roll-1",
        title: "Iniciativa",
        rows: [{ outcome: { expression: "1d20 + 2", total: 22 } }],
      },
    });
  });

  it("adds the Marca bonus to the rolls of a Marcado", async () => {
    vi.mocked(controllerDeps.characters.findById).mockResolvedValueOnce({
      ...character,
      features: ["marked"],
    });
    const result = await controller.roll(owner, {
      characterId: "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90",
      roll: { kind: "initiative" },
    });
    expect(result).toMatchObject({
      payload: { rows: [{ outcome: { expression: "1d20 + 2 + 2", total: 24 } }] },
    });
  });

  it("refuses rolls for another player's character", async () => {
    const result = await controller.roll(
      { accountId: "x", role: "PLAYER" },
      { characterId: "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90", roll: { kind: "initiative" } },
    );
    expect(result).toEqual({ error: rollErrors.forbidden });
  });

  it("reports invalid ability dice", async () => {
    const result = await controller.roll(owner, {
      characterId: "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90",
      roll: { kind: "ability", list: "abilities", id: "bad" },
    });
    expect(result).toEqual({ error: rollErrors.invalidExpression });
  });

  it("lets only the GM level up, raising level and maximums with the rolled dice", async () => {
    expect(
      await controller.levelUp(owner, "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90", {
        addToCurrent: true,
      }),
    ).toEqual({
      error: rollErrors.gmOnly,
    });
    const result = await controller.levelUp(
      { accountId: "gm", role: "GM" },
      "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90",
      {
        addToCurrent: false,
      },
    );
    expect(result).toMatchObject({
      payload: {
        roll: { kind: "levelUp", rows: [{ label: "Vida máxima" }, { label: "Sanidade máxima" }] },
        character: {
          sheet: { identity: { level: 2 }, resources: { health: { max: 6 }, sanity: { max: 20 } } },
        },
      },
    });
  });

  it("reports a conflict when the sheet changed during the level up, writing against the read version", async () => {
    const updateSheet = vi.fn().mockResolvedValue(null);
    const racing = createRollController({
      characters: {
        findById: vi.fn().mockResolvedValue(character),
        updateSheet,
        hasAccess: vi.fn().mockResolvedValue(false),
      },
      randomInt: (_min, max) => max,
      createId: () => "roll-2",
      now: () => new Date(0),
    });
    const result = await racing.levelUp({ accountId: "gm", role: "GM" }, character.id, {
      addToCurrent: true,
    });
    expect(result).toEqual({ error: rollErrors.conflict });
    expect(updateSheet).toHaveBeenCalledWith(character.id, expect.anything(), character.updatedAt);
  });

  it("rejects malformed requests", async () => {
    expect(await controller.roll(owner, { roll: "x" })).toEqual({
      error: rollErrors.invalidRequest,
    });
  });

  it("rolls maximum damage on a natural 20", async () => {
    const result = await controller.roll(owner, {
      characterId: "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90",
      roll: { kind: "ability", list: "abilities", id: "golpe" },
    });
    expect(result).toMatchObject({
      payload: {
        rows: [{ label: "Ataque" }, { label: "Dano", maximized: true, outcome: { total: 13 } }],
        notes: ["Crítico: dano máximo"],
      },
    });
  });

  it("shares a trait or an item with the table", async () => {
    const trait = await controller.ping(owner, {
      characterId: "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90",
      entry: { kind: "trait", id: "t1" },
    });
    expect(trait).toMatchObject({
      payload: {
        kind: "trait",
        title: "Visão no escuro",
        subtitle: "Traço",
        rows: [],
        notes: ["Enxerga no escuro."],
        rolledByGm: false,
      },
    });
    const item = await controller.ping(
      { accountId: "gm", role: "GM" },
      { characterId: "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90", entry: { kind: "item", id: "i1" } },
    );
    expect(item).toMatchObject({
      payload: { kind: "item", notes: ["Qtd. 1 · 1,5 kg · CA +2"], rolledByGm: true },
    });
  });

  it("refuses pings for missing entries, other players and malformed requests", async () => {
    const characterId = "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90";
    expect(
      await controller.ping(owner, { characterId, entry: { kind: "item", id: "t1" } }),
    ).toEqual({ error: rollErrors.entryNotFound });
    expect(
      await controller.ping(
        { accountId: "x", role: "PLAYER" },
        { characterId, entry: { kind: "trait", id: "t1" } },
      ),
    ).toEqual({ error: rollErrors.pingForbidden });
    expect(await controller.ping(owner, { characterId, entry: { kind: "skill" } })).toEqual({
      error: rollErrors.invalidPing,
    });
  });
});
