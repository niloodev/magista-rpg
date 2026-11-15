import { describe, expect, it } from "vitest";

import {
  accountRoom,
  characterRoom,
  createGateRegistry,
  createRateGate,
  pendingOf,
  groupTokenChanges,
  groupTokenRemovals,
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

describe("token batches", () => {
  const token = (id: string) =>
    ({
      id,
      sceneId: "s",
      characterId: null,
      name: id,
      imageUrl: null,
      imageThumbUrl: null,
      x: 0,
      y: 0,
      size: 140,
      hidden: false,
      position: 0,
    }) as const;

  it("gives the players what they may see, the GM everything, and lists tokens that left the players' view", () => {
    const batches = groupTokenChanges([
      { token: token("a"), audience: "table", previousAudience: "table" },
      { token: token("b"), audience: "gm", previousAudience: "table" },
      { token: token("c"), audience: "gm", previousAudience: "gm" },
    ]);
    expect(batches.players.map((entry) => entry.id)).toEqual(["a"]);
    expect(batches.gm.map((entry) => entry.id)).toEqual(["a", "b", "c"]);
    expect(batches.hiddenFromTable).toEqual([{ id: "b", sceneId: "s" }]);
  });

  it("groups removals by who could see each token", () => {
    const groups = groupTokenRemovals([
      { event: { id: "a", sceneId: "s" }, audience: "table" },
      { event: { id: "b", sceneId: "s" }, audience: "gm" },
    ]);
    expect(groups).toEqual({
      table: [{ id: "a", sceneId: "s" }],
      gm: [{ id: "b", sceneId: "s" }],
    });
  });
});
