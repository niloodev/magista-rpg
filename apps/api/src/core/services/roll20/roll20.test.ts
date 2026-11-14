import { describe, expect, it } from "vitest";

import { fromRoll20Export } from "./roll20";

const attr = (name: string, current: string | number) => ({ name, current, max: "", id: name });

const fixture = {
  name: " Personagem Teste ",
  attributes: [
    attr("class", "Caçador"),
    attr("level", "7"),
    attr("alignment", "Morte"),
    attr("variant", "Anima do Fim"),
    attr("for", "16"),
    attr("forPR", "proficiente"),
    attr("des", ""),
    attr("intPR", "0"),
    attr("percepcaoProf", "proficiente"),
    attr("hp", "32"),
    attr("maxHp", "40"),
    attr("aberturas", "-2"),
    attr("deslocBonus", "1"),
    attr("pesoMaximo", "2000"),
    attr("forMod", 99),
    attr("repeating_habs_-AbC_habname", "Golpe"),
    attr("repeating_habs_-AbC_habmodS", "forMod"),
    attr("repeating_habs_-AbC_habdado", "1d12"),
    attr("repeating_habs_-AbC_habhitmodS", "-"),
    attr("repeating_habs_-AbC_habbasedamage", "base"),
    attr("repeating_habs_-AbC_habproficiency", "prof"),
    attr("repeating_inventory_-z1_invname", "Corda"),
    attr("repeating_inventory_-z1_invpeso", "500"),
    attr("repeating_inventory_-a2_invname", "Escudo"),
    attr("repeating_inventory_-a2_invca", "2"),
    attr("repeating_inventory_-a2_invquant", "1"),
    attr("_reporder_repeating_inventory", "-A2,-Z1"),
    attr("repeating_tracos_-t_traconame", "Poeta"),
    attr("repeating_reino_-r_reinoname", "Manifesto"),
  ],
};

describe("fromRoll20Export", () => {
  const { name, sheet } = fromRoll20Export(fixture);

  it("maps identity, normalizing class and legacy alignment values", () => {
    expect(name).toBe("Personagem Teste");
    expect(sheet.identity).toEqual({
      class: "cacador",
      level: 7,
      alignment: "anatema",
      alignmentNote: "Anima do Fim",
    });
  });

  it("maps attributes, proficiencies and ignores derived values", () => {
    expect(sheet.attributes.for).toEqual({ value: 16, proficient: true });
    expect(sheet.attributes.des).toEqual({ value: null, proficient: false });
    expect(sheet.attributes.int.proficient).toBe(false);
    expect(sheet.skills.percepcao.proficient).toBe(true);
  });

  it("maps resources and combat, clamping openings", () => {
    expect(sheet.resources.health).toEqual({ current: 32, max: 40 });
    expect(sheet.combat).toEqual({ openings: 0, movementBonus: true });
    expect(sheet.inventory.maxWeightGrams).toBe(2000);
  });

  it("maps repeating sections honoring _reporder", () => {
    expect(sheet.abilities[0]).toMatchObject({
      id: "-AbC",
      name: "Golpe",
      attackAttribute: "for",
      damageAttribute: null,
      damageDice: "1d12",
      damageFlat: 0,
      addBaseDamage: true,
      addProficiency: true,
    });
    expect(sheet.inventory.items.map((item) => item.name)).toEqual(["Escudo", "Corda"]);
    expect(sheet.inventory.items[1]).toMatchObject({
      weightGrams: 500,
      armorBonus: 0,
      quantity: null,
    });
    expect(sheet.traits[0]?.name).toBe("Poeta");
    expect(sheet.innerRealm[0]?.name).toBe("Manifesto");
  });

  it("rejects exports without a name", () => {
    expect(() => fromRoll20Export({ attributes: [] })).toThrow();
  });
});
