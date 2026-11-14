import { describe, expect, it } from "vitest";

import { accountRoom, characterRoom, createRateGate } from "./realtime.utils";

describe("realtime utils", () => {
  it("names rooms", () => {
    expect(accountRoom("a")).toBe("account:a");
    expect(characterRoom("c")).toBe("character:c");
  });

  it("limits bursts inside the window and frees up after it", () => {
    let clock = 0;
    const gate = createRateGate(2, 1000, () => clock);
    expect([gate(), gate(), gate()]).toEqual([true, true, false]);
    clock = 1001;
    expect(gate()).toBe(true);
  });
});
