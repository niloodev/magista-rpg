import type { AccountRole } from "../schemas/account";

export const TABLE_ROOM = "table:main";

export interface IPresenceMember {
  accountId: string;
  login: string;
  role: AccountRole;
  characterName: string | null;
}

export interface ServerToClientEvents {
  "presence:update": (members: IPresenceMember[]) => void;
}

export type ClientToServerEvents = Record<string, never>;

export interface SocketData {
  member: IPresenceMember;
}
