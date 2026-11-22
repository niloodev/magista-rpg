import {
  canMoveParty,
  clampToWorld,
  encodeFogMask,
  fillFog,
  moveWorldPartyInputSchema,
  paintFog,
  paintWorldFogInputSchema,
  setWorldLiveInputSchema,
} from "@magista/shared";

import { arenaWorldModels } from "@/core/models/arenaWorld";

import { arenaWorldErrors } from "./arenaWorld.errors";
import type { IArenaWorldController, IArenaWorldControllerDeps } from "./arenaWorld.types";

export function createArenaWorldController({
  worlds,
}: IArenaWorldControllerDeps): IArenaWorldController {
  const failed = (action: string, error: unknown) => {
    console.error(`arenaWorld.${action} failed:`, error);
    return { error: arenaWorldErrors.unexpected };
  };

  const setLive: IArenaWorldController["setLive"] = async (viewer, input) => {
    if (viewer.role !== "GM") return { error: arenaWorldErrors.gmOnly };
    const parsed = setWorldLiveInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaWorldErrors.invalidLive };
    try {
      const state = await worlds.setLive(parsed.data.live);
      return {
        message: state.live ? "Mapa Mundi no ar" : "Mapa Mundi fora do ar",
        payload: { worldLive: state.live },
      };
    } catch (error) {
      return failed("setLive", error);
    }
  };

  const moveParty: IArenaWorldController["moveParty"] = async (viewer, input) => {
    const parsed = moveWorldPartyInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaWorldErrors.invalidMove };
    try {
      const current = await worlds.findWorld();
      if (!canMoveParty(viewer, current.live)) return { error: arenaWorldErrors.notLive };
      const state = await worlds.moveParty(clampToWorld(parsed.data));
      return {
        message: "Grupo movido",
        payload: { value: state.party, audience: state.live ? "table" : "gm" },
      };
    } catch (error) {
      return failed("moveParty", error);
    }
  };

  const paintFogAction: IArenaWorldController["paintFog"] = async (viewer, input) => {
    if (viewer.role !== "GM") return { error: arenaWorldErrors.gmOnly };
    const parsed = paintWorldFogInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaWorldErrors.invalidPaint };
    const request = parsed.data;
    try {
      const state = await worlds.changeFog((fog) =>
        "fill" in request ? fillFog(request.mode) : paintFog(fog, request),
      );
      return {
        message: "Névoa atualizada",
        payload: {
          value: { fog: encodeFogMask(state.fog), fogVersion: state.fogVersion },
          audience: state.live ? "table" : "gm",
        },
      };
    } catch (error) {
      return failed("paintFog", error);
    }
  };

  return { setLive, moveParty, paintFog: paintFogAction };
}

export const arenaWorldController = createArenaWorldController({ worlds: arenaWorldModels });
