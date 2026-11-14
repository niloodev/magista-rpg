import { describe, expect, it } from "vitest";

import { createEmptySheet } from "../../schemas/character/character.utils";
import { applyLevelUp, blockOutcomes, buildLevelUpSpec, buildRollSpec } from "./rolls";
import { rollRequestSchema } from "./rolls.schemas";

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
});
