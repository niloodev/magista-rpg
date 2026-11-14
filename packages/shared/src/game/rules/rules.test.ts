import { describe, expect, it } from "vitest";

import { createEmptySheet } from "../../schemas/character/character.utils";
import { attributeModifier, baseDamageFor, deriveSheet, proficiencyForLevel } from "./rules";
import { joinExpression } from "./rules.utils";

describe("rules", () => {
  it("truncates modifiers toward zero like Roll20", () => {
    expect(attributeModifier(null)).toBe(0);
    expect(attributeModifier(9)).toBe(0);
    expect(attributeModifier(7)).toBe(-1);
    expect(attributeModifier(3)).toBe(-3);
    expect(attributeModifier(34)).toBe(12);
  });

  it("computes proficiency by level", () => {
    expect([1, 2, 3, 6, 12, 19, 99].map(proficiencyForLevel)).toEqual([1, 1, 2, 3, 6, 10, 10]);
  });

  it("scales base damage past level 12", () => {
    expect(baseDamageFor("executor", 13)).toBe("5d12 + 1");
    expect(baseDamageFor("arcanista", 14)).toBe("1d20 + 12");
    expect(baseDamageFor("fadador", 5)).toBe("1d6 + 2");
  });

  it("joins expressions skipping zeros and signing negatives", () => {
    expect(joinExpression(["1d20", 0, -1, 3])).toBe("1d20 - 1 + 3");
    expect(joinExpression(["", "1d8"])).toBe("1d8");
  });

  it("derives a full sheet", () => {
    const sheet = createEmptySheet();
    sheet.identity = { class: "vanguardista", level: 9, alignment: "vodu", alignmentNote: "" };
    sheet.attributes.for = { value: 16, proficient: true };
    sheet.attributes.con = { value: 18, proficient: false };
    sheet.attributes.sab = { value: 9, proficient: false };
    sheet.skills.atletismo.proficient = true;
    sheet.combat.movementBonus = true;
    sheet.inventory.items = [
      { id: "a", name: "Escudo", quantity: 2, armorBonus: 5, weightGrams: 3000, description: "" },
    ];
    sheet.abilities = [
      {
        id: "h1",
        name: "Golpe",
        attackAttribute: "for",
        damageDice: "1d12",
        damageFlat: 2,
        damageAttribute: "for",
        addBaseDamage: true,
        addProficiency: true,
        description: "",
      },
    ];

    const derived = deriveSheet(sheet);
    expect(derived.proficiency).toBe(5);
    expect(derived.attributes.for).toEqual({ value: 16, modifier: 3, dc: 18 });
    expect(derived.skills.atletismo).toBe(8);
    expect(derived.armorClass).toBe(17);
    expect(derived.movementMeters).toBe(8);
    expect(derived.baseDamage).toBe("1d8 + 11");
    expect(derived.lifeDie).toBe("8 + 1d4 + 4");
    expect(derived.sanityDie).toBe("13 + 1d7");
    expect(derived.currentWeightGrams).toBe(3000);
    expect(derived.abilities.h1).toEqual({
      attack: "1d20 + 3 + 5",
      damage: "1d12 + 1d8 + 11 + 2 + 3",
    });
  });
});
