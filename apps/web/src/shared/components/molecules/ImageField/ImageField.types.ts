export type ImageFieldShape = "circle" | "portrait";

export interface ImageFieldProps {
  id: string;
  label: string;
  hint: string;
  shape: ImageFieldShape;
  /** Newly chosen file (not uploaded yet). */
  file: File | null;
  /** Image already saved, shown while no new file is chosen. */
  currentUrl: string | null;
  /** The saved image is marked to be removed on save (shows a note and "Desfazer"). */
  removed?: boolean;
  error?: string | null;
  onFileChange: (file: File | null) => void;
  onRemoveCurrent: () => void;
  onUndoRemove?: () => void;
}
