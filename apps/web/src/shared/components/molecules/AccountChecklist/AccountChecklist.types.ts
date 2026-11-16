import type { IAccount } from "@magista/shared";

export interface AccountChecklistProps {
  /** Accounts to choose from (already filtered to the role that matters). */
  accounts: IAccount[];
  selected: string[];
  onToggle: (accountId: string, checked: boolean) => void;
  legend: string;
  emptyLabel: string;
  disabled?: boolean;
  /** Placeholder rows while the accounts load (the search stays real but inert). */
  loadingRows?: number;
}
