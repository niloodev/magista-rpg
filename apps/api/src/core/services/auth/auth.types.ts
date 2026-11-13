import type { AccountRole } from "@magista/shared";

export interface ISessionTokenPayload {
  sub: string;
  role: AccountRole;
}
