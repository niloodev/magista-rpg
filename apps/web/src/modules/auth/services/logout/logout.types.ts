import type { SessionActions } from "@/modules/auth/store";

export type LogoutDeps = Pick<SessionActions, "setSession">;
