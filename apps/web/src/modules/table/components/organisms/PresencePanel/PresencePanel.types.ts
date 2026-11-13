import type { IPresenceMember } from "@magista/shared";

import type { ConnectionStatus } from "@/modules/table/table.types";

export interface PresencePanelProps {
  status: ConnectionStatus;
  members: IPresenceMember[];
}
