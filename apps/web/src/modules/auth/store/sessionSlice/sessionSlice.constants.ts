import type { SessionState } from "./sessionSlice.types";

export const defaultSessionState: SessionState = {
  session: { status: "idle", data: null },
};
