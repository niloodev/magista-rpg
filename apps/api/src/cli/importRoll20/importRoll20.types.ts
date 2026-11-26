/** The command line of the Roll20 importer. */
export interface IImportArgs {
  folder: string;
  force: boolean;
  only: string[];
  account: string | null;
}
