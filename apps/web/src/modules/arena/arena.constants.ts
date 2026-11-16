import { ARENA_UNIT_PX, type ArenaEffectStyle, type IArenaBounds } from "@magista/shared";

import type { IArenaEffectCatalogEntry, IArenaSidebarState } from "./arena.types";

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
  "Clique num token para selecionar; Shift+clique soma à seleção e arrastar no vazio seleciona em grupo. Arraste os tokens selecionados para mover. Botão direito num token abre Aplicar mudança (dano e cura); arrastar com o botão direito, do meio ou Espaço move a câmera. Setas movem a seleção (Shift move mais), M aplica dano ou cura na seleção, Ctrl+A seleciona todos, + e - aproximam e afastam, 0 ajusta o mapa e Esc limpa a seleção.";

export const ARENA_MY_TRAY_LABEL = "Meus tokens";

export const ARENA_ZOOM_LABELS = { in: "Aproximar", out: "Afastar", fit: "Ajustar mapa" } as const;

export const ARENA_ZOOM_STEP = 1.25;

export const ARENA_NUDGE_STEP = 10;

export const ARENA_NUDGE_STEP_LARGE = 50;

export const ARENA_NUDGE_COMMIT_MS = 350;

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
  configure: "Configurar",
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
  tabs: "Abas do painel de rolagens",
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
  board: "Tamanho do tabuleiro",
  boardWidth: "Largura",
  boardHeight: "Altura",
  boardUnit: "unidades",
  boardRatio: "Proporção do mapa mantida",
  boardPixels: (width: number, height: number) =>
    `${width.toLocaleString("pt-BR")} × ${height.toLocaleString("pt-BR")} px · 1 unidade = ${ARENA_UNIT_PX} px`,
  boardMapSize: (width: number, height: number) =>
    `Imagem original: ${width.toLocaleString("pt-BR")} × ${height.toLocaleString("pt-BR")} px`,
  boardOriginal: "Tamanho original da imagem",
  boardTokens: "Os tokens continuam no mesmo ponto do mapa e mantêm o tamanho deles.",
  boardInvalid: "Use de 5 a 285 unidades por lado.",
  remove: "Excluir",
  newSceneHere: "Nova cena aqui",
  newFolderHere: "Nova pasta aqui",
  emptyLibrary: "Nenhuma cena ainda. Crie a primeira e envie o mapa.",
  emptyFolder: "Pasta vazia. Arraste cenas para cá.",
  sceneName: "Nome da cena",
  folderName: "Nome da pasta",
  map: "Mapa",
  mapHint: "PNG, JPG, WEBP ou GIF, até 60 MB e 16384 px de lado. O mapa é otimizado ao enviar.",
  mapTooLarge: "O mapa passa do limite de 60 MB.",
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

/** Floating sheet windows open at the same time in the Arena (opening another closes the one at the back). */
export const ARENA_SHEET_WINDOWS_MAX = 4;

export const ARENA_SHEET_WINDOW_TEXTS = {
  title: (name: string | null) => (name ? `Ficha de ${name}` : "Ficha"),
  close: (name: string | null) => (name ? `Fechar a ficha de ${name}` : "Fechar a ficha"),
  popout: (name: string | null) =>
    name
      ? `Abrir a ficha de ${name} numa janela do navegador`
      : "Abrir a ficha numa janela do navegador",
} as const;

/** Where floating sheet windows open and how they cascade, in CSS pixels. */
export const ARENA_SHEET_WINDOW_LAYOUT = {
  gap: 24,
  top: 72,
  minTop: 56,
  cascade: 32,
  width: 640,
  bottomGap: 88,
  zBase: 40,
  storagePrefix: "magista-arena-sheet-window:",
} as const;

export const ARENA_DOCK_TAB_PREFIX = "sheet:";

export const ARENA_DOCK_TEXTS = {
  tab: (name: string | null) => name ?? "Ficha",
  hint: "Solte para encaixar a ficha como aba",
  dockLeft: (name: string | null) =>
    `Encaixar ${name ? `a ficha de ${name}` : "a ficha"} no painel de rolagens`,
  dockRight: (name: string | null) =>
    `Encaixar ${name ? `a ficha de ${name}` : "a ficha"} na barra lateral`,
  undock: "Desencaixar",
  undockLabel: (name: string | null) =>
    `Desencaixar ${name ? `a ficha de ${name}` : "a ficha"} numa janela`,
  close: "Fechar",
  closeLabel: (name: string | null) => `Fechar ${name ? `a ficha de ${name}` : "a ficha"}`,
  rollsTab: "Rolagens",
} as const;

export const ARENA_WINDOW_ICON_BUTTON =
  "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center text-muted-strong transition-colors hover:bg-white/5 hover:text-accent-text";

/** Map width always left between the side panels (they shrink, never below their minimum, to keep it). */
export const ARENA_MAP_MIN_WIDTH = 360;

/** Screen diameter limits of the token drag preview, in CSS pixels. */
export const ARENA_TOKEN_PREVIEW_LIMITS = { min: 40, max: 200 } as const;

/** Texts of "Aplicar mudança" (damage and healing from the token). */
export const ARENA_CHANGE_TEXTS = {
  title: "Aplicar mudança",
  close: "Fechar",
  action: "Ação",
  damage: "Causar dano",
  heal: "Aplicar cura",
  resource: "Atributo",
  health: "Vida",
  sanity: "Sanidade",
  amount: "Valor",
  attacker: "Quem ataca",
  noAttacker: "Ninguém",
  noAttackerHint: "Só o alvo anima.",
  attackerHint: (name: string) => `${name} avança e golpeia.`,
  casterHint: (name: string) => `${name} conjura e lança.`,
  decrease: "Diminuir valor",
  increase: "Aumentar valor",
  effect: "Efeito",
  changeEffect: "Trocar",
  changeEffectLabel: (name: string) => `Efeito: ${name}. Trocar efeito`,
  quick: (amount: number) => `Valor ${amount}`,
  target: (name: string, count: number) => (count > 1 ? `${count} tokens` : name),
  submit: (kind: "damage" | "heal", resource: "health" | "sanity", amount: number) =>
    kind === "damage"
      ? `Causar ${amount} de dano na ${resource === "health" ? "vida" : "sanidade"}`
      : `Curar ${amount} de ${resource === "health" ? "vida" : "sanidade"}`,
  keys: "Enter aplica · Shift mantém aberto",
  invalid: "Informe um valor entre 1 e 999.",
  applied: (label: string, target: string) => `${label} em ${target}.`,
} as const;

/** Texts of the effect picker. */
export const ARENA_EFFECT_TEXTS = {
  title: "Escolher efeito",
  description: "O efeito toca para toda a mesa. Clique num efeito para ver o exemplo.",
  auto: "Automático",
  autoDescription: (name: string) => `Muda com a ação e o atributo. Agora: ${name}.`,
  autoShort: (name: string) => `Automático (${name})`,
  search: "Buscar efeito",
  searchPlaceholder: "Buscar efeito...",
  filters: "Filtrar efeitos",
  count: (count: number) => (count === 1 ? "1 efeito" : `${count} efeitos`),
  empty: "Nenhum efeito encontrado. Tente outro nome ou filtro.",
  withAttacker: "Mostrar quem ataca",
  withAttackerLite: "No modo performance o exemplo mostra só o alvo.",
  pause: "Pausar exemplo",
  replay: "Tocar exemplo",
  previewLabel: (name: string) => `Exemplo do efeito ${name}`,
  previewLoading: "Carregando o exemplo",
  use: "Usar efeito",
  cancel: "Cancelar",
} as const;

/** Labels of the effect tags (what each effect fits best). */
export const ARENA_EFFECT_TAG_LABELS = {
  damage: "Dano",
  heal: "Cura",
  health: "Vida",
  sanity: "Sanidade",
} as const;

/** Filters of the picker, in order; "fits" keeps the effects made for the action and attribute set. */
export const ARENA_EFFECT_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "fits", label: "Para esta ação" },
  { value: "damage", label: "Dano" },
  { value: "heal", label: "Cura" },
  { value: "health", label: "Vida" },
  { value: "sanity", label: "Sanidade" },
] as const;

/**
 * Catalog of the animations: the one place that names and describes each effect, tells what it fits (tags,
 * used by the picker filters) and gives its accent. A new effect needs an id in `ARENA_EFFECT_STYLES` (shared),
 * an entry here and its players in `services/arenaEffectPlayers` (the types refuse a missing one).
 */
export const ARENA_EFFECT_CATALOG: Record<ArenaEffectStyle, IArenaEffectCatalogEntry> = {
  strike: {
    name: "Golpe",
    description: "Cortes em lâmina, faíscas, cacos e um tranco no mapa. Quem ataca voa e bate.",
    tags: ["damage", "health"],
    accent: "bg-primary",
    attack: "lunge",
  },
  fissure: {
    name: "Fissura",
    description:
      "O alvo falha e racha, fumaça escura e runas quebrando. Quem ataca lança um orbe sombrio.",
    tags: ["damage", "sanity"],
    accent: "bg-teal-600",
    attack: "cast",
  },
  ember: {
    name: "Brasa viva",
    description:
      "Aura rosada, brasas em espiral e pétalas subindo. Quem ataca lança um orbe quente.",
    tags: ["heal", "health"],
    accent: "bg-ruby-400",
    attack: "cast",
  },
  clarity: {
    name: "Clareza",
    description: "Ondas calmas, feixes de luz e runas subindo. Quem ataca lança um orbe claro.",
    tags: ["heal", "sanity"],
    accent: "bg-teal-400",
    attack: "cast",
  },
};

export const ARENA_CHANGE_QUICK_AMOUNTS = [1, 5, 10] as const;

export const ARENA_CHANGE_STORAGE_KEY = "magista-arena-change";

/** Width of the menu, used to keep it inside the map area. */
export const ARENA_CHANGE_MENU_WIDTH = 352;

export const ARENA_CHANGE_MENU_HEIGHT = 420;

/** Texts of the status readout and of the token settings dialog. */
export const ARENA_STATUS_TEXTS = {
  readout: (parts: string[]) => parts.join(" · "),
  health: (value: string) => `Vida ${value}`,
  sanity: (value: string) => `Sanidade ${value}`,
  settingsTitle: "Configurações do token",
  settingsDescription: (name: string) => `Ajustes só deste token: ${name}.`,
  statusSection: "Vida e sanidade",
  linked: (name: string) => `Acompanha a ficha de ${name}. Edite pela ficha.`,
  npcHint: "Valores próprios deste token. Sem máximo, a barra não aparece.",
  openSheet: "Abrir ficha",
  viewersSection: "Quem vê vida e sanidade",
  viewersHint: "O Mestre sempre vê. Os demais só veem as barras se estiverem marcados aqui.",
  everyone: "Todos os jogadores",
  alwaysSee: (logins: string) => `Sempre veem (acesso à ficha): ${logins}.`,
  noPlayers: "Nenhuma conta de jogador criada ainda.",
  accountsLoading: "Carregando as contas",
  accountsFailed: "Não foi possível carregar as contas.",
  retryAccounts: "Tentar de novo",
  save: "Salvar",
  cancel: "Cancelar",
  saved: "Configurações do token salvas.",
} as const;
