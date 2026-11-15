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
import type { IPingRequest, IRollRequest, IRollResult } from "../game/rolls/rolls.types";
import type { AccountRole } from "../schemas/account";
import type { ICharacter, ICharacterImages } from "../schemas/character";
import type { ControllerResult } from "./envelope";

export const TABLE_ROOM = "table:main";

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
  "roll:result": (result: IRollResult) => void;
  "roll:history": (results: IRollResult[]) => void;
  "library:changed": () => void;
  "character:images": (images: ICharacterImages) => void;
  "character:features": (event: ICharacterFeaturesEvent) => void;
  "marked:proposal": (proposal: IMarkedProposal) => void;
  "marked:resolved": (resolution: IMarkedResolution) => void;
  "marked:share": (share: IMarkedShare | null) => void;
}

export interface ClientToServerEvents {
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
}

export interface SocketData {
  member: IPresenceMember;
}
