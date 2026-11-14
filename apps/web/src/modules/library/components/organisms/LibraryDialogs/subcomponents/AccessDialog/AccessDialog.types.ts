import type { IAccount } from "@magista/shared";

export interface AccessDialogProps {
  characterName: string;
  accounts: IAccount[];
  initialAccountIds: string[];
  onSubmit: (accountIds: string[]) => Promise<string | null>;
  onManageAccounts: () => void;
  onClose: () => void;
}
