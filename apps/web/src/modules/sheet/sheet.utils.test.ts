import { describe, expect, it } from "vitest";

import {
  createAbility,
  createItem,
  formatSigned,
  formatWeight,
  portraitOf,
  validateAbility,
  validateItem,
  validateTrait,
} from "./sheet.utils";

describe("sheet utils", () => {
  it("formats weights and signed modifiers", () => {
    expect(formatWeight(1500)).toBe("1,5 kg");
    expect(formatWeight(0)).toBe("0 kg");
    expect(formatSigned(3)).toBe("+3");
    expect(formatSigned(0)).toBe("0");
    expect(formatSigned(-2)).toBe("-2");
  });

  it("prefers the round token for portraits", () => {
    expect(portraitOf({ tokenUrl: "/t.png", avatarUrl: "/a.png" })).toBe("/t.png");
    expect(portraitOf({ tokenUrl: null, avatarUrl: "/a.png" })).toBe("/a.png");
  });

  it("creates blank entries with unique ids", () => {
    expect(createAbility().id).not.toBe(createAbility().id);
    expect(createItem()).toMatchObject({ quantity: 1, weightGrams: 0, armorBonus: 0 });
  });

  it("validates names and dice", () => {
    const ability = { ...createAbility(), name: " " };
    expect(validateAbility(ability)).toEqual({ name: expect.any(String) });
    expect(validateAbility({ ...ability, name: "Golpe", damageDice: "1d" })).toEqual({
      damageDice: expect.any(String),
    });
    expect(validateAbility({ ...ability, name: "Golpe", damageDice: "2d6 + 1d4" })).toEqual({});
    expect(validateAbility({ ...ability, name: "Golpe", damageDice: "" })).toEqual({});
    expect(validateItem({ ...createItem(), name: "" })).toHaveProperty("name");
    expect(validateTrait({ id: "t", name: "Ok", description: "" })).toEqual({});
    expect(validateAbility({ ...ability, name: "Golpe", damageFlat: 100000 })).toEqual({
      damageFlat: "Valor fora do limite permitido.",
    });
    expect(validateItem({ ...createItem(), name: "Escudo", armorBonus: 5000 })).toHaveProperty(
      "armorBonus",
    );
  });
});
