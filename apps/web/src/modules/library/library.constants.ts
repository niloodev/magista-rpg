import type { ILibraryShape } from "./library.types";

export const ROOT_FOLDER_LABEL = "Todas as fichas";

export const DRAG_ID_SEPARATOR = ":";

export const ROOT_DROP_KIND = "root";

export const ROOT_DROP_ID = "root:root";

export const FOLDER_EDGE_RATIO = 0.28;

export const AUTO_EXPAND_DELAY_MS = 650;

export const EXPANDED_STORAGE_KEY = "magista:library:expanded";

export const SEARCH_SHORTCUT = "/";

export const EMPTY_FOLDER_TEXT = "Pasta vazia. Arraste fichas para cá.";

export const LIBRARY_SHAPE_HINT_KEY = "l";

export const LIBRARY_SHAPE_MAX_ROWS = 40;

export const LIBRARY_SHAPE_MAX_LEVEL = 99;

export const LIBRARY_SHAPE_MAX_COUNT = 999;

export const LIBRARY_SHAPE_MAX_ACCESS = 8;

export const LIBRARY_SHAPE_MAX_TEXT = 40;

const DEFAULT_SUBTITLE = "Arcanista · Nível 5";

export const DEFAULT_LIBRARY_SHAPE: ILibraryShape = {
  tree: [0, 1, 2].map(() => ({
    kind: "character" as const,
    name: 12,
    subtitle: DEFAULT_SUBTITLE,
    access: [12],
  })),
  list: [
    { name: 12, subtitle: DEFAULT_SUBTITLE },
    { name: 12, subtitle: DEFAULT_SUBTITLE },
  ],
};

export const LIBRARY_TITLES = { gm: "Fichas da mesa", player: "Suas fichas" } as const;

export const SEARCH_PLACEHOLDER = "Buscar ficha pelo nome...  ( / )";
