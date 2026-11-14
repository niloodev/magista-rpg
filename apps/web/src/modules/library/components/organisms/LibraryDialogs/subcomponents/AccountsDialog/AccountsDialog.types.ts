import type { IAccount, ICreateAccountInput, ICreatedAccount } from "@magista/shared";

export interface IAccountRow {
  account: IAccount;
  isGm: boolean;
  countLabel: string;
}

export interface AccountsDialogProps {
  rows: IAccountRow[];
  onCreate: (
    input: ICreateAccountInput,
  ) => Promise<{ created: ICreatedAccount } | { error: string }>;
  onClose: () => void;
}
