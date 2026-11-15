import type { z } from "zod";

import type {
  arenaSceneSchema,
  arenaTokenSchema,
  arenaViewSchema,
  createArenaSceneInputSchema,
  createArenaTokenInputSchema,
  moveArenaTokenInputSchema,
  moveArenaTokensInputSchema,
  updateArenaTokensInputSchema,
  deleteArenaTokensInputSchema,
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

export type IMoveArenaTokensInput = z.infer<typeof moveArenaTokensInputSchema>;

export type IUpdateArenaTokensInput = z.infer<typeof updateArenaTokensInputSchema>;

export type IArenaTokenPatch = IUpdateArenaTokensInput["updates"][number];

export type IDeleteArenaTokensInput = z.infer<typeof deleteArenaTokensInputSchema>;

/** Tokens stored by a move, plus the ids that were refused (not controlled, hidden or gone). */
export interface IArenaMoveResult {
  tokens: IArenaToken[];
  refused: string[];
}

/** Live drag preview relayed to the other tabs (never persisted). */
export interface IArenaDragEvent {
  moves: IMoveArenaTokenInput[];
}

export interface IArenaTokenRemovedEvent {
  id: string;
  sceneId: string;
}

/** Something in the Arena changed: refetch the view (and the GM, the scene list). `sceneId` null means any scene. */
export interface IArenaSceneEvent {
  sceneId: string | null;
}
