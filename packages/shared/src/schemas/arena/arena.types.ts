import type { z } from "zod";

import type {
  arenaSceneSchema,
  arenaTokenSchema,
  arenaViewSchema,
  createArenaSceneInputSchema,
  createArenaTokenInputSchema,
  moveArenaTokenInputSchema,
  renameArenaSceneInputSchema,
  setActiveSceneInputSchema,
  updateArenaTokenInputSchema,
} from "./arena.schemas";

export type IArenaScene = z.infer<typeof arenaSceneSchema>;

export type IArenaToken = z.infer<typeof arenaTokenSchema>;

export type IArenaView = z.infer<typeof arenaViewSchema>;

export type ICreateArenaSceneInput = z.infer<typeof createArenaSceneInputSchema>;

export type IRenameArenaSceneInput = z.infer<typeof renameArenaSceneInputSchema>;

export type ISetActiveSceneInput = z.infer<typeof setActiveSceneInputSchema>;

export type ICreateArenaTokenInput = z.input<typeof createArenaTokenInputSchema>;

export type IUpdateArenaTokenInput = z.infer<typeof updateArenaTokenInputSchema>;

export type IMoveArenaTokenInput = z.infer<typeof moveArenaTokenInputSchema>;

/** Live drag preview relayed to the other tabs (never persisted). */
export interface IArenaDragEvent {
  tokenId: string;
  x: number;
  y: number;
}

export interface IArenaTokenRemovedEvent {
  id: string;
  sceneId: string;
}

/** Something in the Arena changed: refetch the view (and the GM, the scene list). `sceneId` null means any scene. */
export interface IArenaSceneEvent {
  sceneId: string | null;
}
