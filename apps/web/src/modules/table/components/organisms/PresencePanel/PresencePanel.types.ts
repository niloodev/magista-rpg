import type { IPresenceMember } from "@magista/shared";
import type { ElementType } from "react";

import type { ConnectionStatus } from "@/modules/table/table.types";

export interface PresencePanelProps {
  status: ConnectionStatus;
  members: IPresenceMember[];
  loadingRows?: number[];
  titleAs?: ElementType;
  nested?: boolean;
}
