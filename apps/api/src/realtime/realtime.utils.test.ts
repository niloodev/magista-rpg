import { GM_ROOM, TABLE_ROOM } from "@magista/shared";
import { describe, expect, it } from "vitest";

import {
  effectEmits,
  statusEmits,
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

describe("statusEmits", () => {
  const status = { health: { current: 4, max: 10 }, sanity: { current: null, max: null } };
  const base = {
    tokenId: "t1",
    sceneId: "s1",
    characterId: null,
    status,
    access: { public: false, accountIds: ["bob"] },
    table: true,
    revokedPublic: false,
    revokedAccountIds: [],
  };

  it("gives the GM the permissions and the allowed rooms only the status", () => {
    expect(statusEmits([base])).toEqual([
      {
        to: [GM_ROOM],
        except: [],
        event: { sceneId: "s1", entries: [{ tokenId: "t1", status, access: base.access }] },
      },
      {
        to: ["account:bob"],
        except: [GM_ROOM],
        event: { sceneId: "s1", entries: [{ tokenId: "t1", status }] },
      },
    ]);
  });

  it("reaches the sheet room of a character token and hides it from who lost the permission", () => {
    const emits = statusEmits([
      {
        ...base,
        characterId: "c1",
        access: { public: false, accountIds: [] },
        revokedAccountIds: ["bob"],
      },
    ]);
    expect(emits.slice(1)).toEqual([
      {
        to: ["character:c1"],
        except: [GM_ROOM],
        event: { sceneId: "s1", entries: [{ tokenId: "t1", status }] },
      },
      {
        to: ["account:bob"],
        except: [GM_ROOM, "character:c1"],
        event: { sceneId: "s1", entries: [{ tokenId: "t1", status: null }] },
      },
    ]);
  });

  it("uses the table room when public and hides it from the table when it stops being", () => {
    expect(statusEmits([{ ...base, access: { public: true, accountIds: [] } }])[1]?.to).toEqual([
      TABLE_ROOM,
    ]);
    const revoked = statusEmits([
      { ...base, access: { public: false, accountIds: [] }, revokedPublic: true },
    ]);
    expect(revoked[1]).toEqual({
      to: [TABLE_ROOM],
      except: [GM_ROOM],
      event: { sceneId: "s1", entries: [{ tokenId: "t1", status: null }] },
    });
  });

  it("merges tokens that go to the same rooms into one event", () => {
    const publicAccess = { public: true, accountIds: [] };
    const emits = statusEmits([
      { ...base, access: publicAccess },
      { ...base, tokenId: "t2", access: publicAccess },
    ]);
    expect(emits).toHaveLength(2);
    expect(emits[1]?.event.entries.map((entry) => entry.tokenId)).toEqual(["t1", "t2"]);
  });

  it("sends only to the GM what the table does not see", () => {
    expect(statusEmits([{ ...base, table: false }])).toHaveLength(1);
  });
});

describe("effectEmits", () => {
  it("groups effects per audience and scene", () => {
    const effect = { kind: "damage" as const, resource: "health" as const, amount: 3 };
    expect(
      effectEmits([
        { ...effect, sceneId: "s1", tokenId: "a", audience: "table" },
        { ...effect, sceneId: "s1", tokenId: "b", audience: "table" },
        { ...effect, sceneId: "s1", tokenId: "c", audience: "gm" },
      ]),
    ).toEqual([
      {
        audience: "table",
        event: {
          sceneId: "s1",
          effects: [
            { ...effect, tokenId: "a" },
            { ...effect, tokenId: "b" },
          ],
        },
      },
      { audience: "gm", event: { sceneId: "s1", effects: [{ ...effect, tokenId: "c" }] } },
    ]);
  });
});
