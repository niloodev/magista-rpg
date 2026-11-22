import type { IArenaWorldFogEvent, IWorldPoint } from "@magista/shared";

export type MoveWorldPartyResult = { ok: true; party: IWorldPoint } | { ok: false; error: string };

export type PaintWorldFogResult =
  { ok: true; fog: IArenaWorldFogEvent } | { ok: false; error: string };
