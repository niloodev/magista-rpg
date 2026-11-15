export const USAGE =
  'Uso: npm run import:roll20-pages -- <pasta-pages> [--folder "Roll20"] [--only 2,12,57] [--folders nomes.json] [--folders-template] [--force]';

/** Scene folder that receives the imported tree, at the root of the GM library. */
export const DEFAULT_ROOT_FOLDER = "Roll20";

/** Roll20 layer that holds the map image of a page. */
export const ROLL20_MAP_LAYER = "map";

/** The GM the command acts as (it runs on the server, with database access). */
export const CLI_VIEWER = { accountId: "cli", role: "GM" as const };
