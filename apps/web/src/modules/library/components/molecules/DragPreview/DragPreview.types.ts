import type { IconName } from "@/shared/components/atoms";

export interface DragPreviewProps {
  kind: "folder" | "leaf";
  name: string;
  portraitUrl: string | null;
  leafIcon?: IconName;
}
