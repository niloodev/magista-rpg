import type { IRollPending, IRollResult } from "@magista/shared";
import { describe, expect, it } from "vitest";

import { createAppStore } from "@/modules/shell/store/appSlice/appSlice";

const roll = (id: string) => ({ id }) as IRollResult;

const pending = (id: string) => ({ id, characterName: "Ana" }) as IRollPending;

describe("table slice", () => {
  it("keeps the latency only while connected", () => {
    const store = createAppStore();
    store.getState().setConnection("connected");
    store.getState().setLatency(42);
    expect(store.getState().table.latencyMs).toBe(42);
    store.getState().setConnection("disconnected");
    expect(store.getState().table.latencyMs).toBeNull();
  });

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

  it("shows a pending roll until its result arrives, and never after it", () => {
    const store = createAppStore();
    store.getState().addPendingRoll(pending("r1"));
    store.getState().addPendingRoll(pending("r2"));
    expect(store.getState().table.pendingRolls.map((item) => item.id)).toEqual(["r2", "r1"]);
    store.getState().pushRoll(roll("r1"));
    expect(store.getState().table.pendingRolls.map((item) => item.id)).toEqual(["r2"]);
    store.getState().addPendingRoll(pending("r1"));
    expect(store.getState().table.pendingRolls.map((item) => item.id)).toEqual(["r2"]);
    store.getState().addPendingRoll(pending("r3"));
    store.getState().setRolls([roll("r3")]);
    expect(store.getState().table.pendingRolls.map((item) => item.id)).toEqual(["r2"]);
    store.getState().dropPendingRoll("r2");
    expect(store.getState().table.pendingRolls).toEqual([]);
  });
});

describe("tableSlice without churn", () => {
  it("keeps the state when latency or members repeat", () => {
    const store = createAppStore();
    store.getState().setLatency(40);
    const before = store.getState().table;
    store.getState().setLatency(40);
    expect(store.getState().table).toBe(before);
    const members = [{ accountId: "a", login: "Ana", role: "PLAYER" as const }];
    store.getState().setMembers(members);
    const withMembers = store.getState().table;
    store.getState().setMembers([{ ...members[0]! }]);
    expect(store.getState().table).toBe(withMembers);
  });
});
