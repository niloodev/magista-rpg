import type { IDropTarget, ITreeCharacterView } from "../../LibraryTree.types";

export interface TreeCharacterProps {
  character: ITreeCharacterView;
  target: IDropTarget | null;
  excluded: string[];
}
