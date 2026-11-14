import type { ISheetResource } from "@magista/shared";

export type ResourceTone = "health" | "sanity";

export interface ResourceBarProps {
  label: string;
  tone: ResourceTone;
  resource: ISheetResource;
  onChange: (resource: ISheetResource) => void;
  maxLocked?: boolean;
}
