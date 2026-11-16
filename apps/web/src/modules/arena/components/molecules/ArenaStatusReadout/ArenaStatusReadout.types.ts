import type { IArenaTokenStatus } from "@magista/shared";

export interface ArenaStatusReadoutProps {
  status: IArenaTokenStatus;
  /** Text for screen readers ("Vida 12/20 · Sanidade 8/15"). */
  label: string;
}
