export interface NpcTokenDialogProps {
  /** Creates the token; resolves to an error message (shown in the form alert) or null. */
  onSubmit: (name: string, file: File | null) => Promise<string | null>;
  onClose: () => void;
}
