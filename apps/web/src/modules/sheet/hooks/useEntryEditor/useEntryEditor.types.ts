export type EntryErrors<T> = Partial<Record<keyof T, string>>;

export type EditorMode = "create" | "edit";

export interface EntryEditorOptions<T extends { id: string }> {
  validate: (draft: T) => EntryErrors<T>;
  onCreate: (entry: T) => void;
  onUpdate: (entry: T) => void;
  onDelete: (entry: T) => void;
}
