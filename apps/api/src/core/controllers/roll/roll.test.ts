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
];

const character: ICharacter = {
  id: "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90",
  name: "Kael",
  avatarUrl: null,
  tokenUrl: null,
  sheet,
  sheetVersion: 1,
  updatedAt: new Date(0).toISOString(),
};

const controller = createRollController({
  characters: {
    findById: vi.fn().mockResolvedValue(character),
    updateSheet: vi.fn().mockImplementation(async (_id, next) => ({ ...character, sheet: next })),
    hasAccess: vi.fn().mockImplementation(async (_id, accountId) => accountId === "owner"),
  },
  randomInt: (_min, max) => max,
  createId: () => "roll-1",
  now: () => new Date(0),
});

const owner = { accountId: "owner", role: "PLAYER" as const };

describe("roll controller", () => {
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
});
