import type { IArenaBounds } from "@magista/shared";

export const ARENA_TITLE = "Arena";

export const ARENA_PATH = "/arena";

export const ARENA_BACK_PREFIX = "Voltar para a ";

export const ARENA_BACK_FULL_LABEL = "Voltar para a mesa";

export const ARENA_LOAD_ERROR_TITLE = "Não foi possível abrir a Arena";

export const ARENA_ZOOM_GROUP_LABEL = "Zoom do mapa";

export const ARENA_MAP_ERROR = "Não foi possível carregar o mapa desta cena.";

export const ARENA_MOVED_LABEL = (name: string, count: number) =>
  count > 1 ? `${count} tokens movidos.` : `${name} movido.`;

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
  "Clique num token para selecionar; Shift+clique soma à seleção e arrastar no vazio seleciona em grupo. Arraste os tokens selecionados para mover. Botão direito, do meio ou Espaço+arrastar movem a câmera. Setas movem a seleção (Shift move mais), Ctrl+A seleciona todos, + e - aproximam e afastam, 0 ajusta o mapa e Esc limpa a seleção.";

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

export const ARENA_MOBILE_TEXTS = {
  title: "Jogue no PC",
  body: "A Arena foi feita para telas grandes, com mouse e teclado. Abra a mesa num computador para jogar; no celular você ainda pode ver a mesa e as fichas.",
} as const;

export const ARENA_SIZE_STEP = 10;

export const ARENA_SIZE_COMMIT_MS = 400;

export const ARENA_SELECTION_TEXTS = {
  region: "Tokens selecionados",
  size: "Tamanho",
  sizeLabel: "tamanho dos tokens selecionados",
  hide: "Ocultar",
  show: "Mostrar",
  openSheet: "Abrir ficha",
  remove: "Remover",
  count: (count: number) => (count === 1 ? "1 token selecionado" : `${count} tokens selecionados`),
  confirmTitle: (count: number) => (count === 1 ? "Remover token?" : `Remover ${count} tokens?`),
  confirmMessage:
    "Os tokens saem da cena para todos. As fichas continuam na biblioteca e podem voltar ao mapa depois.",
} as const;

export const ARENA_BOTTOM_INSET = 72;
