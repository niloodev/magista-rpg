import type { ISheetResource } from "@magista/shared";

import type { ResourceTone } from "@/modules/sheet/components/molecules/ResourceBar";

export interface QuickResourceProps {
  label: string;
  tone: ResourceTone;
  resource: ISheetResource;
  onCurrentChange: (current: number | null) => void;
}
