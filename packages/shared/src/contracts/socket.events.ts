import type { IRollRequest, IRollResult } from "../game/rolls/rolls.types";
import type { AccountRole } from "../schemas/account";
import type { ICharacter } from "../schemas/character";
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
}

export interface ClientToServerEvents {
  "roll:request": (
    request: IRollRequest,
    ack: (result: ControllerResult<IRollResult>) => void,
  ) => void;
}

export interface SocketData {
  member: IPresenceMember;
}
