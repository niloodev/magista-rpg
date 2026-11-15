export interface IRoll20MapGraphic {
  id: string;
  width: number;
  height: number;
}

/** What the importer uses from a Roll20 `page.json`. */
export interface IRoll20Page {
  /** Folder of the export (like "002 - Vale do Mel"), for the report and `--only`. */
  dir: string;
  /** Number of the export folder (002 is 2). */
  index: number;
  name: string;
  /** Roll20 page folder ids, from the outermost to the page's own folder. */
  folderPath: string[];
  /** Page size in Roll20 units. */
  width: number;
  height: number;
  map: IRoll20MapGraphic | null;
}

/** A Roll20 page folder rebuilt as a scene folder. */
export interface IRoll20Folder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface IRoll20Options {
  root: string;
  rootFolder: string;
  only: Set<number> | null;
  foldersFile: string | null;
  template: boolean;
  force: boolean;
}
