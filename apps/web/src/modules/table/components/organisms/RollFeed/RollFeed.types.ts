import type { IRollResult } from "@magista/shared";

export interface RollFeedProps {
  rolls: IRollResult[];
  loading?: boolean;
  nested?: boolean;
  className?: string;
}
