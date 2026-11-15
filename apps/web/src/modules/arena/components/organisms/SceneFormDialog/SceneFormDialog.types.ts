export interface ISceneFormValues {
  name: string;
  file: File | null;
}

export interface SceneFormDialogProps {
  title: string;
  submitLabel: string;
  /** Label of the name field, or null for a map-only form. */
  nameLabel: string | null;
  initialName?: string;
  /** Shows the map field (optional when creating, required when changing the map). */
  withMap: boolean;
  mapRequired?: boolean;
  currentMapUrl?: string | null;
  onSubmit: (values: ISceneFormValues) => Promise<string | null>;
  onClose: () => void;
}
