import { describe, expect, it } from "vitest";

import {
  accountRoom,
  characterRoom,
  createGateRegistry,
  createRateGate,
  pendingOf,
} from "./realtime.utils";

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

  it("keeps one independent gate per key", () => {
    const gateOf = createGateRegistry(1, 1000, () => 0);
    expect(gateOf("a")).toBe(gateOf("a"));
    expect([gateOf("a")(), gateOf("a")(), gateOf("b")()]).toEqual([true, false, true]);
  });

  it("announces a roll without its dice", () => {
    const pending = pendingOf(
      {
        id: "r",
        kind: "attribute",
        characterId: "c",
        characterName: "Ana",
        portraitUrl: null,
        rolledByGm: false,
        title: "Força",
        subtitle: "Teste",
        rows: [
          { label: "Força", outcome: { total: 18, dice: [], modifier: 0, natural: null } as never },
        ],
        notes: ["segredo"],
        createdAt: new Date(0).toISOString(),
      },
      3000,
      0,
    );
    expect(pending).toEqual({
      id: "r",
      kind: "attribute",
      characterId: "c",
      characterName: "Ana",
      portraitUrl: null,
      rolledByGm: false,
      title: "Força",
      subtitle: "Teste",
      revealAt: new Date(3000).toISOString(),
    });
  });
});
