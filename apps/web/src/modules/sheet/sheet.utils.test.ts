import { describe, expect, it } from "vitest";

import {
  bonusNote,
  createAbility,
  createItem,
  formatSigned,
  portraitOf,
  validateAbility,
  validateItem,
  validateTrait,
} from "./sheet.utils";

describe("sheet utils", () => {
  it("formats signed modifiers", () => {
    expect(formatSigned(3)).toBe("+3");
    expect(formatSigned(0)).toBe("0");
    expect(formatSigned(-2)).toBe("-2");
  });

  it("prefers the round token for portraits", () => {
    expect(portraitOf({ avatarUrl: "/t.png", artUrl: "/a.png" })).toBe("/t.png");
    expect(portraitOf({ avatarUrl: null, artUrl: "/a.png" })).toBe("/a.png");
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

  it("describes the special feature bonuses already in the shown values", () => {
    expect(bonusNote([])).toBe("");
    expect(bonusNote([{ label: "Marca", value: 2 }])).toBe(" Valores já somam +2 da Marca.");
    expect(
      bonusNote([
        { label: "Marca", value: 2 },
        { label: "Fúria", value: 1 },
        { label: "Bênção", value: 1 },
      ]),
    ).toBe(" Valores já somam +2 da Marca, +1 da Fúria e +1 da Bênção.");
  });
});
