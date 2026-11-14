import type { LibraryDialog } from "@/modules/library/library.types";

export interface LibraryDialogsProps {
  dialog: LibraryDialog | null;
  onOpen: (dialog: LibraryDialog) => void;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onNotice: (message: string) => void;
  onExpandFolders: (folderIds: string[]) => void;
}
