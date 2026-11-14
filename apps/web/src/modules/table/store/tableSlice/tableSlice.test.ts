import type { IRollResult } from "@magista/shared";
import { describe, expect, it } from "vitest";

import { createAppStore } from "@/modules/shell/store/appSlice/appSlice";

const roll = (id: string) => ({ id }) as IRollResult;

describe("table slice", () => {
  it("puts new rolls on top without duplicates and caps the feed", () => {
    const store = createAppStore();
    store.getState().setRolls(Array.from({ length: 60 }, (_, index) => roll(`h${index}`)));
    expect(store.getState().table.rolls).toHaveLength(50);
    store.getState().pushRoll(roll("novo"));
    store.getState().pushRoll(roll("novo"));
    expect(store.getState().table.rolls.filter((item) => item.id === "novo")).toHaveLength(1);
    expect(store.getState().table.rolls[0]?.id).toBe("novo");
  });

  it("marca o histórico como carregado só quando ele chega", () => {
    const store = createAppStore();
    expect(store.getState().table.rollsLoaded).toBe(false);
    store.getState().pushRoll(roll("antes"));
    expect(store.getState().table.rollsLoaded).toBe(false);
    store.getState().setRolls([]);
    expect(store.getState().table.rollsLoaded).toBe(true);
  });
});
