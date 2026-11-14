import { describe, expect, it } from "vitest";

import { createEmptySheet } from "../../schemas/character/character.utils";
import {
  applyLevelUp,
  blockOutcomes,
  buildLevelUpSpec,
  buildPingSpec,
  buildRollSpec,
  rollSpecRows,
} from "./rolls";
import { CRITICAL_DAMAGE_NOTE } from "./rolls.constants";
import { pingRequestSchema, rollRequestSchema } from "./rolls.schemas";

describe("rolls", () => {
  const sheet = createEmptySheet();
  sheet.identity.level = 4;
  sheet.attributes.con.value = 14;
  sheet.attributes.des.value = 7;

  it("builds attribute and skill rolls", () => {
    expect(buildRollSpec(sheet, { kind: "attribute", key: "con" })?.rows[0]?.expression).toBe(
      "1d20 + 2",
    );
    expect(buildRollSpec(sheet, { kind: "skill", key: "acrobacia" })?.rows[0]?.expression).toBe(
      "1d20 - 1",
    );
  });

  it("computes Bloqueio Firme reductions with the raw CON value", () => {
    const spec = buildRollSpec(sheet, { kind: "block", key: "firme" });
    expect(spec?.notes[0]).toContain("9");
    expect(spec?.notes[1]).toContain("18");
  });

  it("exposes block outcomes for the UI", () => {
    expect(blockOutcomes("agressivo", sheet)).toHaveLength(3);
  });

  it("returns null for unknown abilities", () => {
    expect(buildRollSpec(sheet, { kind: "ability", list: "abilities", id: "x" })).toBeNull();
  });

  it("builds the level up roll from the life and sanity dice", () => {
    const spec = buildLevelUpSpec(sheet);
    expect(spec?.subtitle).toBe("Nível 4 → 5");
    expect(spec?.rows.map((row) => row.expression)).toEqual(["4 + 1d2 + 2", "13 + 1d7"]);
  });

  it("applies a level up to maximums and optionally current values", () => {
    const base = structuredClone(sheet);
    base.resources.health = { current: 10, max: 20 };
    base.resources.sanity = { current: null, max: 30 };
    const raised = applyLevelUp(base, { health: 7, sanity: 15 }, true);
    expect(raised.identity.level).toBe(5);
    expect(raised.resources.health).toEqual({ current: 17, max: 27 });
    expect(raised.resources.sanity).toEqual({ current: 15, max: 45 });
    expect(applyLevelUp(base, { health: 7, sanity: 15 }, false).resources.health.current).toBe(10);
    expect(base.identity.level).toBe(4);
  });

  it("stops at the maximum level", () => {
    const capped = structuredClone(sheet);
    capped.identity.level = 99;
    expect(buildLevelUpSpec(capped)).toBeNull();
  });

  it("validates roll requests", () => {
    expect(
      rollRequestSchema.safeParse({
        characterId: "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90",
        roll: { kind: "skill", key: "voar" },
      }).success,
    ).toBe(false);
    expect(
      rollRequestSchema.safeParse({
        characterId: "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90",
        roll: { kind: "initiative" },
      }).success,
    ).toBe(true);
  });

  describe("ability attacks", () => {
    const armed = structuredClone(sheet);
    armed.abilities = [
      {
        id: "golpe",
        name: "Golpe",
        attackAttribute: "for",
        damageDice: "2d6",
        damageFlat: 1,
        damageAttribute: null,
        addBaseDamage: false,
        addProficiency: false,
        description: "Corte.",
      },
    ];
    const spec = buildRollSpec(armed, { kind: "ability", list: "abilities", id: "golpe" });

    it("marks the attack and damage rows", () => {
      expect(spec?.rows.map((row) => row.role)).toEqual(["attack", "damage"]);
    });

    it("rolls damage normally without a natural 20", () => {
      const rolled = spec && rollSpecRows(spec, () => 2);
      expect(rolled?.rows[1]).toMatchObject({ label: "Dano", outcome: { total: 5 } });
      expect(rolled?.rows[1]?.maximized).toBeUndefined();
      expect(rolled?.notes).toEqual(["Corte."]);
    });

    it("maximizes damage on a natural 20", () => {
      const rolled = spec && rollSpecRows(spec, (_min, max) => (max === 20 ? 20 : 1));
      expect(rolled?.rows[0]?.outcome.terms[0]).toMatchObject({ results: [20] });
      expect(rolled?.rows[1]).toMatchObject({ maximized: true, outcome: { total: 13 } });
      expect(rolled?.notes).toEqual([CRITICAL_DAMAGE_NOTE, "Corte."]);
    });

    it("keeps rolls without an attack row untouched", () => {
      const baseDamage = buildRollSpec(armed, { kind: "baseDamage" });
      const rolled = baseDamage && rollSpecRows(baseDamage, () => 20);
      expect(rolled?.rows[0]?.maximized).toBeUndefined();
    });
  });

  describe("pings", () => {
    const owned = structuredClone(sheet);
    owned.traits = [{ id: "t1", name: "Visão no escuro", description: "Enxerga no escuro." }];
    owned.inventory.items = [
      {
        id: "i1",
        name: "Escudo",
        quantity: 1,
        armorBonus: 2,
        weightGrams: 1500,
        description: "De madeira.",
      },
      { id: "i2", name: "", quantity: null, armorBonus: 0, weightGrams: 0, description: "" },
    ];

    it("shares a trait with its description", () => {
      expect(buildPingSpec(owned, { kind: "trait", id: "t1" })).toEqual({
        title: "Visão no escuro",
        subtitle: "Traço",
        rows: [],
        notes: ["Enxerga no escuro."],
      });
    });

    it("shares an item with its summary and description", () => {
      expect(buildPingSpec(owned, { kind: "item", id: "i1" })?.notes).toEqual([
        "Qtd. 1 · 1,5 kg · CA +2",
        "De madeira.",
      ]);
      expect(buildPingSpec(owned, { kind: "item", id: "i2" })).toMatchObject({
        title: "Sem nome",
        notes: ["0 kg"],
      });
    });

    it("returns null for missing entries", () => {
      expect(buildPingSpec(owned, { kind: "trait", id: "i1" })).toBeNull();
      expect(buildPingSpec(owned, { kind: "item", id: "nope" })).toBeNull();
    });

    it("validates ping requests", () => {
      const characterId = "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90";
      expect(
        pingRequestSchema.safeParse({ characterId, entry: { kind: "item", id: "i1" } }).success,
      ).toBe(true);
      expect(
        pingRequestSchema.safeParse({ characterId, entry: { kind: "ability", id: "i1" } }).success,
      ).toBe(false);
    });
  });
});
