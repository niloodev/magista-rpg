import { defaultPartyPosition, emptyFogMask } from "@magista/shared";
import { describe, expect, it } from "vitest";

import { toArenaWorldState } from "./arenaWorld.utils";

describe("toArenaWorldState", () => {
  it("gives the default world when the state row does not exist yet", () => {
    expect(toArenaWorldState(null)).toEqual({
      live: false,
      activeSceneId: null,
      party: defaultPartyPosition(),
      fog: emptyFogMask(),
      fogVersion: 0,
    });
  });

  it("maps the row, keeping a fog of the right size", () => {
    const fog = emptyFogMask();
    fog[3] = 0b101;
    const state = toArenaWorldState({
      worldMapLive: true,
      activeSceneId: "scene",
      partyX: 12,
      partyY: 34,
      fogMask: fog,
      fogVersion: 7,
    });
    expect(state).toEqual({
      live: true,
      activeSceneId: "scene",
      party: { x: 12, y: 34 },
      fog,
      fogVersion: 7,
    });
    expect(state.fog).not.toBe(fog);
  });

  it("drops a fog of the wrong size (the grid changed) instead of misreading it", () => {
    const state = toArenaWorldState({
      worldMapLive: false,
      activeSceneId: null,
      partyX: 0,
      partyY: 0,
      fogMask: new Uint8Array(3),
      fogVersion: 2,
    });
    expect(state.fog).toEqual(emptyFogMask());
  });
});
