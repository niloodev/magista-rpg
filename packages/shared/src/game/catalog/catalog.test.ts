import { describe, expect, it } from "vitest";

import { CLASSES, CLASS_KEYS, SKILLS, SKILL_KEYS } from "./catalog.constants";

describe("catalog", () => {
  it("keeps SKILL_KEYS in sync with SKILLS", () => {
    expect(SKILLS.map((skill) => skill.key)).toEqual([...SKILL_KEYS]);
  });

  it("has a 12-level base damage table for every class", () => {
    for (const key of CLASS_KEYS) expect(CLASSES[key].baseDamage).toHaveLength(12);
  });
});
