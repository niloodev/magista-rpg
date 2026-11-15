import type { IArenaBounds } from "@magista/shared";

export const ARENA_TITLE = "Arena";

export const ARENA_PATH = "/arena";

export const ARENA_BACK_PREFIX = "Voltar para a ";

export const ARENA_LOAD_ERROR_TITLE = "Não foi possível abrir a Arena";

export const ARENA_ZOOM_GROUP_LABEL = "Zoom do mapa";

export const ARENA_MAP_ERROR = "Não foi possível carregar o mapa desta cena.";

export const ARENA_MOVED_LABEL = (name: string) => `${name} movido.`;

export const ARENA_STAGE_LABEL = (scene: string, tokens: number) =>
  `Mapa da cena ${scene}, ${tokens} tokens`;

export const ARENA_BACK_LABEL = "Mesa";

export const ARENA_BACK_PATH = "/mesa";

export const ARENA_EMPTY_TEXTS = {
  gm: {
    title: "Nenhuma cena no ar",
    body: "Ainda não há cena na Arena. Em breve você poderá criar cenas, enviar mapas e colocá-las no ar por aqui.",
  },
  player: {
    title: "Nenhuma cena no ar",
    body: "O Mestre ainda não colocou uma cena na Arena. Ela aparece aqui assim que entrar no ar.",
  },
} as const;

export const ARENA_NO_MAP_LABEL = "Cena sem mapa";

export const ARENA_UNSUPPORTED_TEXTS = {
  title: "Seu navegador não abriu o mapa",
  body: "A Arena precisa de WebGL. Ative a aceleração de hardware do navegador ou tente outro navegador.",
} as const;

export const ARENA_LOAD_RETRY_LABEL = "Tentar de novo";

export const ARENA_STAGE_HINT =
  "Clique num token para selecionar. Arraste os seus tokens para mover. Setas movem o token selecionado (Shift move mais). + e - aproximam e afastam, 0 ajusta o mapa e Esc limpa a seleção.";

export const ARENA_TRAY_LABEL = "Tokens da cena";

export const ARENA_MY_TRAY_LABEL = "Meus tokens";

export const ARENA_ZOOM_LABELS = { in: "Aproximar", out: "Afastar", fit: "Ajustar mapa" } as const;

export const ARENA_ZOOM_STEP = 1.25;

export const ARENA_NUDGE_STEP = 10;

export const ARENA_NUDGE_STEP_LARGE = 50;

export const ARENA_NUDGE_COMMIT_MS = 350;

export const ARENA_DRAG_EMIT_MS = 50;

export const ARENA_PREVIEW_STALE_MS = 2000;

export const ARENA_SKELETON_LABEL = "Carregando a Arena";

export const ARENA_MAP_LOADING_LABEL = "Carregando o mapa";

export const ARENA_MEMBERS_LABEL = (count: number) => `${count} na mesa`;

export const ARENA_EMPTY_BOUNDS: IArenaBounds = { width: 3200, height: 2000 };

export const ARENA_TOP_BAR_HEIGHT = 56;

export const ARENA_HINT_KEY = "r";

export const ARENA_HINT_MAX_TRAY = 12;

export const ARENA_HINT_DEFAULT_NAME = 18;
