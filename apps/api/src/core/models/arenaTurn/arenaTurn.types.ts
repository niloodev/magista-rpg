import type { IArenaTurnOrder } from "@magista/shared";

/** Computes the new turn order from the stored one, or null to leave it as it is. */
export type ArenaTurnChange = (order: IArenaTurnOrder) => IArenaTurnOrder | null;

export interface IArenaTurnModels {
  /** Turn order of a scene, or null when the scene does not exist. */
  findOrder: (sceneId: string) => Promise<IArenaTurnOrder | null>;
  /**
   * Changes the turn order of a scene under a lock on the scene row (concurrent commands apply one after the
   * other) and returns the order as stored, or null when the scene does not exist.
   */
  change: (
    sceneId: string,
    apply: ArenaTurnChange,
  ) => Promise<{ order: IArenaTurnOrder; changed: boolean } | null>;
}
