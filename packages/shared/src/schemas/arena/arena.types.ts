import type { z } from "zod";

import type {
  arenaFolderSchema,
  arenaLibrarySchema,
  arenaBoardInputSchema,
  arenaSceneSchema,
  createArenaFolderInputSchema,
  moveArenaLibraryItemInputSchema,
  renameArenaFolderInputSchema,
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

export type IArenaFolder = z.infer<typeof arenaFolderSchema>;

export type IArenaLibrary = z.infer<typeof arenaLibrarySchema>;

export type ICreateArenaFolderInput = z.input<typeof createArenaFolderInputSchema>;

export type IRenameArenaFolderInput = z.infer<typeof renameArenaFolderInputSchema>;

export type IMoveArenaLibraryItemInput = z.infer<typeof moveArenaLibraryItemInputSchema>;

export type IArenaToken = z.infer<typeof arenaTokenSchema>;

export type IArenaView = z.infer<typeof arenaViewSchema>;

export type ICreateArenaSceneInput = z.input<typeof createArenaSceneInputSchema>;

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
  /** Only the GM scene library changed (folders, order); the Arena view itself is the same. */
  libraryOnly?: boolean;
}

export type IArenaBoardInput = z.infer<typeof arenaBoardInputSchema>;
