import type { IArenaToken } from "@magista/shared";

export type MoveArenaTokensResult =
  { ok: true; tokens: IArenaToken[]; refused: string[] } | { ok: false; error: string };
