import type { ISession } from "@magista/shared";

import type { LoadStatus } from "@/shared/types";

export interface SessionState {
  session: {
    status: LoadStatus;
    data: ISession | null;
  };
}

export interface SessionActions {
  setSession: (data: ISession | null) => void;
  setSessionStatus: (status: LoadStatus) => void;
}

export type SessionSlice = SessionState & SessionActions;
