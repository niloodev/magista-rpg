import type { AccountRole } from "@magista/shared";

export interface IViewer {
  accountId: string;
  role: AccountRole;
}
