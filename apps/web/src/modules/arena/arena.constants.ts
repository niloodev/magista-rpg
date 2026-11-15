import type { IArenaBounds } from "@magista/shared";

import type { IArenaSidebarState } from "./arena.types";

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
    body: "Abra a aba Mapas na barra lateral para criar uma cena, enviar o mapa e colocá-la no ar.",
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

export const ARENA_SIDEBAR_WIDTH = { default: 360, min: 300, max: 560 } as const;

export const ARENA_ROLLS_WIDTH = { default: 340, min: 320, max: 520 } as const;

export const ARENA_SIDEBAR_STORAGE_KEY = "magista:arena:sidebar";

export const ARENA_FOLDERS_STORAGE_KEY = "magista:arena:expanded";

export const ARENA_SIDEBAR_TEXTS = {
  label: "Barra lateral da Arena",
  tabs: "Seções da barra lateral",
  characters: "Fichas",
  scenes: "Mapas",
  open: "Abrir barra lateral",
  close: "Recolher barra lateral",
  resize: "Largura da barra lateral",
} as const;

export const ARENA_ROLLS_TEXTS = {
  label: "Rolagens da mesa",
  resize: "Largura das rolagens",
  open: "Abrir rolagens",
  close: "Recolher rolagens",
  emptyHint: "Quando alguém rolar pela ficha, a rolagem aparece aqui para a mesa toda.",
} as const;

export const ARENA_ROLLS_PANEL_ID = "arena-rolls-panel";

export const ARENA_SIDEBAR_PANEL_ID = "arena-sidebar-panel";

export const SCENE_TEXTS = {
  newScene: "Nova cena",
  newFolder: "Nova pasta",
  live: "Ao vivo",
  viewing: "Vendo agora",
  noMap: "Sem mapa",
  open: "Ver cena",
  goLive: "Colocar no ar",
  rename: "Renomear",
  changeMap: "Trocar mapa",
  remove: "Excluir",
  newSceneHere: "Nova cena aqui",
  newFolderHere: "Nova pasta aqui",
  emptyLibrary: "Nenhuma cena ainda. Crie a primeira e envie o mapa.",
  emptyFolder: "Pasta vazia. Arraste cenas para cá.",
  sceneName: "Nome da cena",
  folderName: "Nome da pasta",
  map: "Mapa",
  mapHint: "PNG, JPG, WEBP ou GIF, até 25 MB e 16384 px de lado.",
  mapTooLarge: "O mapa passa do limite de 25 MB.",
  nameRequired: "Informe um nome.",
  mapRequired: "Escolha a imagem do mapa.",
  mapNotSent: "A cena foi criada, mas o mapa não foi enviado:",
  create: "Criar",
  save: "Salvar",
  cancel: "Cancelar",
  deleteSceneTitle: (name: string) => `Excluir a cena ${name}?`,
  deleteSceneMessage:
    "A cena, o mapa e todos os tokens dela serão apagados. As fichas continuam na biblioteca.",
  deleteFolderTitle: (name: string) => `Excluir a pasta ${name}?`,
  deleteFolderMessage: "As cenas e subpastas dela sobem para a pasta de cima. Nada é apagado.",
  sceneActions: (name: string) => `Ações da cena ${name}`,
  summary: (scenes: number, folders: number) =>
    [`${scenes} ${scenes === 1 ? "cena" : "cenas"}`]
      .concat(folders > 0 ? [`${folders} ${folders === 1 ? "pasta" : "pastas"}`] : [])
      .join(" · "),
} as const;

export const SCENE_TREE_LABELS = {
  list: "Pastas e cenas",
  rootIdle: "Todas as cenas",
  rootDragging: "Solte aqui para tirar da pasta (raiz)",
  emptyFolder: "Pasta vazia. Arraste cenas para cá.",
  moveFolder: (name: string) => `Mover pasta ${name}`,
  moveLeaf: (name: string) => `Mover cena ${name}`,
  folderActions: (name: string) => `Ações da pasta ${name}`,
};

export const ARENA_PREVIEW_TEXTS = {
  live: "Ao vivo",
  preview: "Prévia",
  previewHint: "Só você vê esta cena",
  goLive: "Colocar no ar",
  backToLive: "Voltar ao vivo",
  wentLive: "Cena colocada no ar para a mesa.",
  gone: "Essa cena não existe mais. Voltando para a cena ao vivo.",
} as const;

export const DEFAULT_SIDEBAR: IArenaSidebarState = {
  open: true,
  tab: "characters",
  rollsOpen: true,
  width: ARENA_SIDEBAR_WIDTH.default,
  rollsWidth: ARENA_ROLLS_WIDTH.default,
};

export const ARENA_HINT_DELAY_MS = 500;

export const ARENA_PANEL_TOGGLE_POSITION = "absolute top-[calc(50%+1.75rem)] z-20 -translate-y-1/2";

export const ARENA_PLACEMENT_TEXTS = {
  npcButton: "Token avulso",
  npcTitle: "Token avulso",
  npcHelp:
    "Um token sem ficha (NPC, criatura ou objeto). Ele entra no centro da vista, selecionado, e só o Mestre o controla.",
  npcName: "Nome",
  npcImage: "Imagem",
  npcImageHint: "PNG, JPG, WEBP ou GIF, até 8 MB. Sem imagem, o token mostra a inicial.",
  npcSubmit: "Criar token",
  cancel: "Cancelar",
  nameRequired: "Dê um nome ao token.",
  imageTooLarge: "A imagem passa de 8 MB.",
  imageNotSent: "O token foi criado, mas a imagem não foi enviada.",
  noScene: "Abra uma cena para colocar tokens.",
  dragHint: "Arraste uma ficha para o mapa para criar o token ali.",
} as const;

export const ARENA_CHARACTERS_HINT_ID = "arena-characters-hint";

/** Where the selection bar sits: inside the map area, clear of the zoom column, centered and wrapping when narrow. */
export const ARENA_SELECTION_BAR_SLOT = {
  base: "pointer-events-none absolute right-[4.75rem] left-4 z-20 flex justify-center",
  /** Without the token tray the bar sits on the bottom edge; with it (players), above the tray. */
  bottom: { free: "bottom-4", aboveTray: "bottom-[5.75rem]" },
} as const;
