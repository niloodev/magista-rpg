import type { ICharacterFeaturesEvent } from "../game/features/features.types";
import type {
  IMarkedAnswerInput,
  IMarkedCancelInput,
  IMarkedProposal,
  IMarkedProposeInput,
  IMarkedResolution,
  IMarkedShare,
  IMarkedStopInput,
} from "../game/marked/marked.types";
import type {
  IPingRequest,
  IRollPending,
  IRollRequest,
  IRollResult,
} from "../game/rolls/rolls.types";
import type { AccountRole } from "../schemas/account";
import type {
  IArenaSceneEvent,
  IArenaToken,
  IArenaTokenRemovedEvent,
  IArenaMoveResult,
  IMoveArenaTokensInput,
} from "../schemas/arena";
import type { ICharacter, ICharacterImages } from "../schemas/character";
import type { ControllerResult } from "./envelope";

export const TABLE_ROOM = "table:main";

/** How often a client measures its round trip to the server (`presence:ping`). */
export const LATENCY_PING_INTERVAL_MS = 5000;

/** Pings closer than this on the same socket are not answered. */
export const LATENCY_PING_MIN_GAP_MS = 1000;

export const GM_ROOM = "table:gm";

export const CLIENT_ID_HEADER = "x-magista-client";

export const ROLL_HISTORY_LIMIT = 50;

export interface IPresenceMember {
  accountId: string;
  login: string;
  role: AccountRole;
}

export interface ICharacterUpdatedEvent {
  character: ICharacter;
  origin: string | null;
}

export interface ServerToClientEvents {
  "presence:update": (members: IPresenceMember[]) => void;
  "character:updated": (event: ICharacterUpdatedEvent) => void;
  "roll:pending": (pending: IRollPending) => void;
  "roll:result": (result: IRollResult) => void;
  "roll:history": (results: IRollResult[]) => void;
  "library:changed": () => void;
  "character:images": (images: ICharacterImages) => void;
  "character:features": (event: ICharacterFeaturesEvent) => void;
  "marked:proposal": (proposal: IMarkedProposal) => void;
  "marked:resolved": (resolution: IMarkedResolution) => void;
  "marked:share": (share: IMarkedShare | null) => void;
  "arena:scene": (event: IArenaSceneEvent) => void;
  "arena:token": (token: IArenaToken) => void;
  "arena:token-removed": (event: IArenaTokenRemovedEvent) => void;
  /** Several tokens changed at once (a group move or a batch edit), sent as one event. */
  "arena:tokens": (tokens: IArenaToken[]) => void;
  /** Several tokens removed at once (or hidden from the players), sent as one event. */
  "arena:tokens-removed": (events: IArenaTokenRemovedEvent[]) => void;
}

export interface ClientToServerEvents {
  "presence:ping": (ack: () => void) => void;
  "roll:request": (
    request: IRollRequest,
    ack: (result: ControllerResult<IRollResult>) => void,
  ) => void;
  "sheet:ping": (
    request: IPingRequest,
    ack: (result: ControllerResult<IRollResult>) => void,
  ) => void;
  "marked:propose": (
    request: IMarkedProposeInput,
    ack: (result: ControllerResult<IMarkedProposal>) => void,
  ) => void;
  "marked:answer": (
    request: IMarkedAnswerInput,
    ack: (result: ControllerResult<IMarkedProposal>) => void,
  ) => void;
  "marked:cancel": (
    request: IMarkedCancelInput,
    ack: (result: ControllerResult<null>) => void,
  ) => void;
  "marked:stop": (request: IMarkedStopInput, ack: (result: ControllerResult<null>) => void) => void;
  "arena:move": (
    request: IMoveArenaTokensInput,
    ack: (result: ControllerResult<IArenaMoveResult>) => void,
  ) => void;
}

export interface SocketData {
  member: IPresenceMember;
}
