import {
  WORLD_MAP_BOARD,
  decodeFogMask,
  emptyFogMask,
  isFogCovered,
  type IWorldPoint,
} from "@magista/shared";
import { describe, expect, it, vi } from "vitest";

import type { IArenaWorldModels, IArenaWorldState } from "@/core/models/arenaWorld";

import { createArenaWorldController } from "./arenaWorld";
import { arenaWorldErrors } from "./arenaWorld.errors";

const gm = { accountId: "gm", role: "GM" as const };
const alice = { accountId: "alice", role: "PLAYER" as const };

function build(live = false) {
  let state: IArenaWorldState = {
    live,
    activeSceneId: null,
    party: { x: 1000, y: 700 },
    fog: emptyFogMask(),
    fogVersion: 0,
  };
  const worlds: IArenaWorldModels = {
    findWorld: vi.fn(async () => state),
    setLive: vi.fn(async (next: boolean) => {
      state = { ...state, live: next };
      return state;
    }),
    moveParty: vi.fn(async (party: IWorldPoint) => {
      state = { ...state, party };
      return state;
    }),
    changeFog: vi.fn(async (apply: (fog: Uint8Array) => Uint8Array) => {
      state = { ...state, fog: apply(state.fog), fogVersion: state.fogVersion + 1 };
      return state;
    }),
  };
  return { controller: createArenaWorldController({ worlds }), worlds };
}

describe("arena world controller", () => {
  it("lets only the GM put the world map live", async () => {
    const { controller, worlds } = build();
    expect(await controller.setLive(alice, { live: true })).toEqual({
      error: arenaWorldErrors.gmOnly,
    });
    expect(await controller.setLive(gm, { live: "yes" })).toEqual({
      error: arenaWorldErrors.invalidLive,
    });
    expect(await controller.setLive(gm, { live: true })).toMatchObject({
      payload: { worldLive: true },
    });
    expect(worlds.setLive).toHaveBeenCalledTimes(1);
  });

  it("lets players move the party only while the world map is live", async () => {
    const offAir = build(false);
    expect(await offAir.controller.moveParty(alice, { x: 10, y: 10 })).toEqual({
      error: arenaWorldErrors.notLive,
    });
    expect(await offAir.controller.moveParty(gm, { x: 10, y: 10 })).toEqual({
      message: "Grupo movido",
      payload: { value: { x: 10, y: 10 }, audience: "gm" },
    });

    const onAir = build(true);
    expect(await onAir.controller.moveParty(alice, { x: 20, y: 30 })).toMatchObject({
      payload: { value: { x: 20, y: 30 }, audience: "table" },
    });
  });

  it("refuses positions outside the map", async () => {
    const { controller, worlds } = build(true);
    expect(await controller.moveParty(alice, { x: WORLD_MAP_BOARD.width + 1, y: 0 })).toEqual({
      error: arenaWorldErrors.invalidMove,
    });
    expect(worlds.moveParty).not.toHaveBeenCalled();
  });

  it("paints and fills the fog for the GM only, bumping the version", async () => {
    const { controller } = build(true);
    expect(await controller.paintFog(alice, { mode: "hide", fill: true })).toEqual({
      error: arenaWorldErrors.gmOnly,
    });
    expect(await controller.paintFog(gm, { mode: "hide", radius: 1, points: [] })).toEqual({
      error: arenaWorldErrors.invalidPaint,
    });

    const filled = await controller.paintFog(gm, { mode: "hide", fill: true });
    if ("error" in filled) throw new Error(filled.error);
    expect(filled.payload.audience).toBe("table");
    expect(filled.payload.value.fogVersion).toBe(1);
    expect(isFogCovered(decodeFogMask(filled.payload.value.fog), 10, 10)).toBe(true);

    const revealed = await controller.paintFog(gm, {
      mode: "reveal",
      radius: 30,
      points: [{ x: 105, y: 105 }],
    });
    if ("error" in revealed) throw new Error(revealed.error);
    const fog = decodeFogMask(revealed.payload.value.fog);
    expect(isFogCovered(fog, 10, 10)).toBe(false);
    expect(isFogCovered(fog, 30, 30)).toBe(true);
    expect(revealed.payload.value.fogVersion).toBe(2);
  });
});
