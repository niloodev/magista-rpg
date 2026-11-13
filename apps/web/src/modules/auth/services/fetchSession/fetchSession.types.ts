import type { SessionActions } from "@/modules/auth/store";

export type FetchSessionDeps = Pick<SessionActions, "setSession" | "setSessionStatus">;
