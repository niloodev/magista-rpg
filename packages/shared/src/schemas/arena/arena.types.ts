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
  copyArenaTokensInputSchema,
  moveArenaTokenInputSchema,
  moveArenaTokensInputSchema,
  updateArenaTokensInputSchema,
  deleteArenaTokensInputSchema,
  renameArenaSceneInputSchema,
  setActiveSceneInputSchema,
  updateArenaTokenInputSchema,
  arenaTokenStatusSchema,
  arenaTokenStatusAccessSchema,
  applyArenaChangeInputSchema,
} from "./arena.schemas";
import type {
  arenaTurnCommandSchema,
  arenaTurnEntrySchema,
  arenaTurnOrderSchema,
} from "./arena.turns";
import type {
  ARENA_CHANGE_KINDS,
  ARENA_EFFECT_STYLES,
  ARENA_RESOURCE_KEYS,
  sheetEffectsSchema,
} from "./arena.effects";
import type {
  arenaWorldFogEventSchema,
  arenaWorldSchema,
  moveWorldPartyInputSchema,
  paintWorldFogInputSchema,
  setWorldLiveInputSchema,
  worldFogModeSchema,
  worldPointSchema,
} from "./arena.world";

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

export type ICopyArenaTokensInput = z.infer<typeof copyArenaTokensInputSchema>;

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

export type IArenaTokenStatus = z.infer<typeof arenaTokenStatusSchema>;

export type IArenaTokenStatusAccess = z.infer<typeof arenaTokenStatusAccessSchema>;

export type ArenaResourceKey = (typeof ARENA_RESOURCE_KEYS)[number];

export type ArenaChangeKind = (typeof ARENA_CHANGE_KINDS)[number];

export type ArenaEffectStyle = (typeof ARENA_EFFECT_STYLES)[number];

export type ISheetEffects = z.infer<typeof sheetEffectsSchema>;

export type IApplyArenaChangeInput = z.infer<typeof applyArenaChangeInputSchema>;

/** One token status sent to some viewers; `status` null means they can no longer see it. */
export interface IArenaStatusEntry {
  tokenId: string;
  status: IArenaTokenStatus | null;
  /** Status permissions of the token (only in the GM copy of the event). */
  access?: IArenaTokenStatusAccess;
}

export interface IArenaStatusEvent {
  sceneId: string;
  entries: IArenaStatusEntry[];
}

/** New status of a character, sent to the accounts that see it only through a token permission. */
export interface IArenaCharacterStatusEvent {
  characterId: string;
  status: IArenaTokenStatus;
}

/** Damage or healing that hit a token, for the animation (the amount applied, never the status). */
export interface IArenaEffect {
  tokenId: string;
  kind: ArenaChangeKind;
  resource: ArenaResourceKey;
  amount: number;
  /** Token that dealt it (it flies to the target first), when the viewer may see that token. */
  attackerTokenId?: string;
  /** Animation chosen by hand (absent: the automatic one). */
  effect?: ArenaEffectStyle;
}

export interface IArenaEffectEvent {
  sceneId: string;
  effects: IArenaEffect[];
}

/** Tokens that took the change and the ids that were refused (not visible, gone or without that resource). */
export interface IArenaChangeResult {
  applied: string[];
  refused: string[];
}

export type IArenaTurnEntry = z.infer<typeof arenaTurnEntrySchema>;

export type IArenaTurnOrder = z.infer<typeof arenaTurnOrderSchema>;

export type IArenaTurnCommand = z.infer<typeof arenaTurnCommandSchema>;

export type ArenaTurnAction = IArenaTurnCommand["action"];

/** Initiatives being rolled for tokens of a scene: their turn order lines spin until the reveal. */
export interface IArenaTurnPendingEvent {
  sceneId: string;
  tokenIds: string[];
  /** How long until the values show, in ms (relative, so clocks out of sync do not matter). */
  revealInMs: number;
}

export type IArenaWorld = z.infer<typeof arenaWorldSchema>;

export type WorldFogMode = z.infer<typeof worldFogModeSchema>;

export type IWorldPoint = z.infer<typeof worldPointSchema>;

export type ISetWorldLiveInput = z.infer<typeof setWorldLiveInputSchema>;

export type IMoveWorldPartyInput = z.infer<typeof moveWorldPartyInputSchema>;

export type IPaintWorldFogInput = z.infer<typeof paintWorldFogInputSchema>;

export type IArenaWorldFogEvent = z.infer<typeof arenaWorldFogEventSchema>;

/** A brush batch over the fog (the fill variant of `IPaintWorldFogInput` excluded). */
export type IWorldFogStroke = Extract<IPaintWorldFogInput, { points: unknown }>;
