import type { ISessionTokenPayload } from "@/core/services/auth";

export interface IAuthLocals {
  auth: ISessionTokenPayload;
}
