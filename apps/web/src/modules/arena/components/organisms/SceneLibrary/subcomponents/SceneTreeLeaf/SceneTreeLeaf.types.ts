import type { IArenaScene } from "@magista/shared";

import type { ITreeLeafSlots } from "@/modules/library/components";

import type { SceneDialog } from "../../SceneLibrary.types";

export interface SceneTreeLeafProps {
  scene: IArenaScene;
  slots: ITreeLeafSlots;
  live: boolean;
  viewing: boolean;
  onDialog: (dialog: SceneDialog) => void;
  onPreview: (sceneId: string) => void;
  onGoLive: (sceneId: string) => void;
}
