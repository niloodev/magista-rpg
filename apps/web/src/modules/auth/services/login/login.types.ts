import type { SessionActions } from "@/modules/auth/store";

export type LoginDeps = Pick<SessionActions, "setSession">;
