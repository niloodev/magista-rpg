import type { ICharacterSummary } from "@magista/shared";

import type { ITreeLeafSlots } from "@/modules/library/components/organisms/FolderTree";
import type { LibraryDialog } from "@/modules/library/library.types";

export interface CharacterTreeLeafProps {
  character: ICharacterSummary;
  slots: ITreeLeafSlots;
  accountLogins: Map<string, string>;
  onDialog: (dialog: LibraryDialog) => void;
  onOpen?: (characterId: string) => void;
}
