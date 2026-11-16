import type { IArenaEffectPreviewPlay } from "@/modules/arena/services/arenaEffectPreview";

export interface ArenaEffectPreviewCanvasProps {
  play: IArenaEffectPreviewPlay;
  /** Accessible description of what plays. */
  label: string;
  className?: string;
}
