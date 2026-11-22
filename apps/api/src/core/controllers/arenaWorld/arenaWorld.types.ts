import type { ControllerResult, IArenaWorldFogEvent, IWorldPoint } from "@magista/shared";

import type { IArenaWorldModels } from "@/core/models/arenaWorld";

import type { ArenaAudience } from "../arena";
import type { IViewer } from "../controllers.types";
import type { ArenaWorldError } from "./arenaWorld.errors";

export interface IArenaWorldControllerDeps {
  worlds: IArenaWorldModels;
}

/** A world map change and who may see it: the whole table while it is live, otherwise only the GM. */
export interface IArenaWorldChange<T> {
  value: T;
  audience: ArenaAudience;
}

type Result<T> = Promise<ControllerResult<T, ArenaWorldError>>;

export interface IArenaWorldController {
  /** Puts the world map live in place of the live scene, or back (GM only). */
  setLive: (viewer: IViewer, input: unknown) => Result<{ worldLive: boolean }>;
  /** Moves the party token (GM always; players while the world map is live). */
  moveParty: (viewer: IViewer, input: unknown) => Result<IArenaWorldChange<IWorldPoint>>;
  /** Paints the fog with a brush batch, or covers or clears the whole map (GM only). */
  paintFog: (viewer: IViewer, input: unknown) => Result<IArenaWorldChange<IArenaWorldFogEvent>>;
}
