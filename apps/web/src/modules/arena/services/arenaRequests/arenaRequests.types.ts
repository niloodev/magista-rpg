import type { IArenaToken } from "@magista/shared";

export type MoveArenaTokenResult = { ok: true; token: IArenaToken } | { ok: false; error: string };
