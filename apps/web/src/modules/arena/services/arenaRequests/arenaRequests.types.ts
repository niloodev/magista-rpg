import type { IArenaToken } from "@magista/shared";

export type MoveArenaTokensResult =
  { ok: true; tokens: IArenaToken[]; refused: string[] } | { ok: false; error: string };

export type ApplyArenaChangeResult =
  { ok: true; applied: string[]; refused: string[] } | { ok: false; error: string };
