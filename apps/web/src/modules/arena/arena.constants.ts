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
  "Clique num token para selecionar; Shift+clique ou Ctrl+clique soma à seleção e arrastar no vazio seleciona em grupo. Arraste os tokens selecionados para mover. Botão direito num token (ou Shift+F10 na seleção) abre o menu do token: Aplicar mudança, Configurar, Ocultar, Abrir ficha, Copiar e Remover; arrastar com o botão direito, do meio ou Espaço move a câmera. Setas movem a seleção (Shift move mais), M aplica dano ou cura na seleção, Ctrl+A seleciona todos, Ctrl+C copia e Ctrl+V cola os tokens, + e - aproximam e afastam, 0 ajusta o mapa e Esc limpa a seleção. O Mestre pode soltar imagens do computador no mapa para criar tokens.";

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
  confirmMessage: (count: number) =>
    count === 1
      ? "O token sai da cena para todos. A ficha continua na biblioteca e pode voltar ao mapa depois."
      : "Os tokens saem da cena para todos. As fichas continuam na biblioteca e podem voltar ao mapa depois.",
} as const;

/** What players read instead of the name of a token whose name the GM hid. */
export const ARENA_HIDDEN_NAME = "Token";

/** Right-click menu of a token (and of the empty map, to paste). */
export const ARENA_TOKEN_MENU_TEXTS = {
  label: (target: string) => `Ações de ${target}`,
  selectionCount: (count: number) => `${count} tokens`,
  mapLabel: "Ações do mapa",
  apply: "Aplicar mudança",
  configure: "Configurar",
  hide: "Ocultar",
  show: "Mostrar",
  openSheet: "Abrir ficha",
  copy: "Copiar",
  paste: "Colar aqui",
  remove: "Remover",
  rollInitiative: "Rolar iniciativa",
  addToTurns: "Adicionar à iniciativa",
  removeFromTurns: "Remover da iniciativa",
  copied: (count: number) => (count === 1 ? "1 token copiado." : `${count} tokens copiados.`),
  pasted: (count: number) => (count === 1 ? "1 token colado." : `${count} tokens colados.`),
} as const;

export const ARENA_BOTTOM_INSET = 72;

export const ARENA_SIDEBAR_WIDTH = { default: 360, min: 300, max: 560 } as const;

export const ARENA_ROLLS_WIDTH = { default: 340, min: 320, max: 520 } as const;

export const ARENA_SIDEBAR_STORAGE_KEY = "magista:arena:sidebar";

/** Whether the turn order window is open, saved per device. */
export const ARENA_TURNS_STORAGE_KEY = "magista:arena:turns";

export const ARENA_TURN_TEXTS = {
  button: "Turnos",
  buttonYourTurn: "sua vez",
  windowTitle: "Turnos",
  close: "Fechar turnos",
  round: "Rodada",
  roundLabel: (round: number) => `Rodada ${round}`,
  turnOfLabel: "Vez de",
  notStarted: "Aguardando o início",
  listLabel: "Ordem de turnos",
  start: "Começar",
  next: "Próximo turno",
  previous: "Turno anterior",
  endTurn: "Encerrar meu turno",
  sort: "Ordenar por iniciativa",
  clear: "Limpar ordem",
  clearTitle: "Limpar a ordem de turnos?",
  clearMessage: "Todos saem da ordem e a rodada volta para 1.",
  clearConfirm: "Limpar",
  current: "Vez atual",
  upNext: "A seguir",
  rolling: "rolando",
  initiative: (name: string) => `Iniciativa de ${name}`,
  noValue: "·",
  noValueLabel: "sem valor",
  remove: (name: string) => `Tirar ${name} da ordem`,
  rowActions: (name: string) => `Ações de ${name} na ordem`,
  focus: (name: string) => `Passar a vez para ${name}`,
  pick: (name: string) => `Mostrar ${name} no mapa`,
  empty: "Role Iniciativa na ficha para entrar na ordem.",
  emptyGm:
    "Os jogadores entram ao rolar Iniciativa na ficha. Para NPCs, use Rolar iniciativa ou Adicionar à iniciativa no menu do token.",
  turnOf: (name: string, round: number) => `Turno de ${name} (rodada ${round}).`,
  yourTurn: (name: string) => `Sua vez: ${name}.`,
  rolled: (count: number) =>
    count === 1 ? "Rolando a iniciativa." : `Rolando a iniciativa de ${count} tokens.`,
} as const;

/** Turn order window: default size and spot (top right of the map area), below the sheet windows. */
export const ARENA_TURN_WINDOW_LAYOUT = {
  width: 320,
  height: 420,
  gap: 16,
  top: 72,
  min: { width: 260, height: 220 },
  rectKey: "magista:arena:turns-window",
  zIndex: 39,
} as const;

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
  styleLegend: "Formato do token",
  styleNeedsImage: "Escolha uma imagem para usar o formato isométrico.",
  figureImageHint: "PNG ou WEBP com fundo transparente, até 8 MB, em qualquer proporção.",
  dropTitle: (count: number) => (count === 1 ? "Token da imagem" : `Tokens de ${count} imagens`),
  dropHelp: (count: number) =>
    count === 1
      ? "O token entra onde a imagem foi solta, selecionado."
      : "Os tokens entram lado a lado onde as imagens foram soltas, com o nome de cada arquivo.",
  dropSubmit: (count: number) => (count === 1 ? "Criar token" : `Criar ${count} tokens`),
  dropOverlay: "Solte para criar um token",
  playerDragHint:
    "Arraste uma ficha para o mapa, ou use Colocar no mapa no menu dela, para pôr o seu token.",
  dropInvalid: "Nenhuma imagem PNG, JPG, WEBP ou GIF de até 8 MB foi solta.",
  dragHint: "Arraste uma ficha para o mapa para criar o token ali.",
} as const;

/** Alpha below which a pixel counts as transparent when guessing the style of a dropped image. */
export const ARENA_TRANSPARENT_ALPHA = 16;

/** Share of transparent border pixels that makes a dropped image an isometric figure. */
export const ARENA_TRANSPARENT_EDGE_SHARE = 0.3;

/** Side of the small canvas the dropped image is read on to guess its style. */
export const ARENA_TRANSPARENCY_PROBE_PX = 64;

/** Most images turned into tokens by one drop. */
export const ARENA_IMAGE_DROP_MAX = 12;

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
  shooterHint: (name: string) => `${name} saca e atira.`,
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
  free: "Livre",
  ultimate: "Ultimate",
} as const;

/** Filters of the picker, in order; "fits" keeps the effects made for the action and attribute set. */
export const ARENA_EFFECT_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "fits", label: "Para esta ação" },
  { value: "damage", label: "Dano" },
  { value: "heal", label: "Cura" },
  { value: "health", label: "Vida" },
  { value: "sanity", label: "Sanidade" },
  { value: "free", label: "Livres" },
  { value: "ultimate", label: "Ultimates" },
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
  voxPopuli: {
    name: "Vox Populi",
    description:
      "Quando Marion fala e todos acreditam, aquilo sempre foi verdade. O mundo silencia e sangra em vermelho, um vitral do rumor surge apagado sobre o alvo e acende pedaço por pedaço conforme as pessoas acreditam; completo, a realidade racha na tela inteira e o vitral desaba sobre o alvo em mil cacos.",
    tags: ["ultimate", "free"],
    accent: "bg-primary",
    attack: "cast",
  },
  vitaeUnius: {
    name: "Vitae Unius",
    description:
      "A vida de um, a identidade de todos. Tony toca e o dia nasce sobre a mesa: a Flor da Vida se tece em volta do alvo a cada batida do coração, raízes de luz brotam folhas e a luz de todos sobe até ele. Ao florescer, toda maldição se parte e queima em luz, raios giram pela tela e uma tempestade de pétalas toma tudo.",
    tags: ["ultimate", "free"],
    accent: "bg-gold-400",
    attack: "cast",
  },
  entropiaPoema: {
    name: "Entropia e Poema",
    description:
      "Tudo que nasce aprende a ruir. Selvarin abre um buraco negro sobre o alvo e o mundo escurece em vermelho e preto; a gravidade curva a imagem do mapa, correntes vêm de além da tela e prendem o alvo, o poema escrito em runas em volta do buraco é sugado em espiral e o alvo é esticado na direção do vazio, até o buraco colapsar e explodir.",
    tags: ["ultimate", "free"],
    accent: "bg-ruby-900",
    attack: "cast",
  },
  deathRebirth: {
    name: "Reencarnação da Morte",
    description:
      "A Morte vem e o alvo renasce. A noite cai em violeta sob um eclipse negro, sombras sobem do chão e se enrolam no alvo sobre um selo de Nox, o Olho do Fim racha sua alma em branco e a sombra espectral da pá da Morte desce e o esmaga; então ele renasce num pilar de fogo de Nox enquanto as almas libertas sobem.",
    tags: ["ultimate", "free"],
    accent: "bg-fx-nox",
    attack: "cast",
  },
  divineCall: {
    name: "Chamado Divino",
    description:
      "Heylel chama e os céus respondem. Uma auréola de energia dourada se forma no alto, correntes de luz descem em espiral, asas de energia se abrem atrás do alvo e uma coluna de luz desce sobre ele: na cura, uma bênção que o ergue e o ilumina por dentro; no dano, um julgamento que o atinge em branco puro.",
    tags: ["ultimate", "free"],
    accent: "bg-gold-400",
    attack: "cast",
  },
  betweenWorlds: {
    name: "Entre os mundos",
    description:
      "Antropozohl, o Deus das Passagens, abre a porta entre os mundos. A mesa afunda em água escura, correntes trazem um enxame de borboletas azuis e brancas que gira em volta do alvo, e do enxame se abrem as asas colossais do deus, com olhos que se abrem e o encaram; a água sob o alvo vira um redemoinho, as asas se fecham num estalo e o alvo é arrastado para o outro lado, cuspido de volta numa coluna de água enquanto o enxame se espalha.",
    tags: ["ultimate", "free"],
    accent: "bg-fx-abyss",
    attack: "cast",
  },
  gunshot: {
    name: "Magia completamente normal mágica",
    description:
      "Uma bola de fogo comum, dessas que todo mago aprende no primeiro ano. Totalmente arcana, nada de pólvora, nada de metal, nenhum barulho estranho. Se fizer BANG, é a magia. Livre para qualquer ação.",
    tags: ["free"],
    accent: "bg-gold-400",
    attack: "shot",
  },
  shovel: {
    name: "Pazada",
    description:
      "Uma boa e honesta pazada. Quem ataca avança com uma pá, ergue bem alto e desce de chapa no alvo: CLANG, faíscas de metal, poeira e pedrinhas voando, e o alvo achatado balançando de volta.",
    tags: ["free"],
    accent: "bg-fx-earth",
    attack: "lunge",
  },
  soulDrain: {
    name: "Sugada Espiritual",
    description:
      "Lorcan abre a boca e suga a alma do alvo. Uma boca espectral de presas violeta se abre ao lado de quem ataca, uma fita de alma é arrancada do alvo, que perde a cor, e flui até ela; no fim, um gole, e quem ataca brilha com a vida tomada.",
    tags: ["free"],
    accent: "bg-fx-nox",
    attack: "cast",
  },
  floralStrike: {
    name: "Golpe Floral",
    description:
      "Quem ataca avança soltando pétalas rosas pelo caminho; no golpe uma rajada de pétalas atravessa o alvo, uma grande flor rosa desabrocha sobre ele e explode numa tempestade de pétalas e pólen.",
    tags: ["free"],
    accent: "bg-fx-blossom",
    attack: "lunge",
  },
  floralCast: {
    name: "Conjuração Floral",
    description:
      "Pétalas giram até quem lança e formam um botão de flor que voa até o alvo; ali uma flor enorme desabrocha, pétalas chovem do alto e florzinhas brotam num anel no chão.",
    tags: ["free"],
    accent: "bg-fx-blossom",
    attack: "cast",
  },
  voodooAxe: {
    name: "Ataque Vodu",
    description:
      "Quem ataca avança envolto em chama verde e desce um machado em brasa: um arco de fogo verde, o corte e o alvo ardendo em labaredas.",
    tags: ["free"],
    accent: "bg-fx-verdant",
    attack: "lunge",
  },
  voodooFire: {
    name: "Conjuração Vodu",
    description:
      "Chamas verdes se juntam em quem ataca e uma bola de fogo verde voa até o alvo, que explode em anéis de fogo e fica queimando.",
    tags: ["free"],
    accent: "bg-fx-verdant",
    attack: "cast",
  },
  nonEuclidean: {
    name: "Colapso da Geometria Não Euclidiana",
    description:
      "Figuras impossíveis giram em volta de quem lança e uma hélice de símbolos matemáticos corre até o alvo; ali uma malha de polígonos azuis se dobra, implode num ponto e explode em luz.",
    tags: ["free"],
    accent: "bg-fx-azure",
    attack: "cast",
  },
  passingFlow: {
    name: "Fluxo do passar",
    description:
      "Antropozohl lança uma torrente de água escura cheia de borboletas. Ela bate no alvo e se divide em volta dele, o mapa ondula, uma tromba d'água sobe girando e ergue o alvo afogado; então ela desaba e o esmaga contra o chão num segundo impacto ainda maior, e a água escoa num redemoinho escuro enquanto as borboletas se espalham.",
    tags: ["free"],
    accent: "bg-fx-abyss",
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
  tokenSection: "Token",
  name: "Nome",
  image: "Imagem",
  showName: "Mostrar nome no mapa",
  showNameHint: "Desmarcado, os jogadores não veem o nome; o Mestre o vê apagado.",
  initiativeBonus: "Bônus de iniciativa",
  initiativeBonusHint: "Somado ao 1d20 em Rolar iniciativa (menu do token).",
  imageFailed: "As configurações foram salvas, mas a imagem não.",
} as const;

/** Marker of the world map in the GM's preview (`viewSceneId`): the world map takes the place of a scene id. */
export const ARENA_WORLD_VIEW = "world";

/** The fixed world map image (preloaded with high priority by the Arena route). */
export const WORLD_MAP_URL = "/arena/world-map.jpg";

export const WORLD_MAP_THUMB_URL = "/arena/world-map-thumb.webp";

/** Static files the Arena loads before showing itself (the loading screen counts them; add new ones here). */
export const ARENA_ASSETS = [{ url: WORLD_MAP_URL, label: "Mapa Mundi" }] as const;

export const ARENA_ASSET_TEXTS = {
  title: "Preparando a mesa",
  updating: (version: string) => `Atualizando para a versão ${version}`,
  label: "Carregando os recursos da Arena",
  maps: "Mapas da mesa",
  effects: "Efeitos da mesa",
  detail: (label: string | null, loaded: string, total: string | null) =>
    label ? `${label} · ${total ? `${loaded} de ${total}` : loaded}` : "Pronto",
  effectsDetail: (done: number, total: number) => `Efeitos da mesa · ${done} de ${total}`,
  version: (version: string) => `v${version}`,
} as const;

/** Share of the loading bar for the files (the rest is warming the animations up). */
export const ARENA_ASSET_FILES_SHARE = 0.75;

/** Longest wait for the board to exist before warming the animations up (no live map: nothing to warm). */
export const ARENA_ASSET_STAGE_WAIT_MS = 4000;

/** How many files the loading screen downloads at the same time (the first ones, the most needed, go first). */
export const ARENA_ASSET_CONCURRENCY = 3;

/**
 * Longest the files may hold the loading screen; past it the screen moves on and the scene maps keep warming the
 * cache in the background.
 */
export const ARENA_ASSET_FILES_LIMIT_MS = 12_000;

/** Longest the animation warm-up may hold the loading screen. */
export const ARENA_ASSET_WARM_LIMIT_MS = 20_000;

/** The loading screen always shows first and stays at least this long, even when everything is cached. */
export const ARENA_ASSET_SCREEN_MIN_MS = 1000;

/** How long the loading screen takes to fade out (the same as `overlay-out`). */
export const ARENA_ASSET_SCREEN_FADE_MS = 260;

/** Colors the party token cycles through: one per player. */
export const WORLD_PARTY_COLORS = [
  0x1e3a8a, 0x38bdf8, 0x22c55e, 0xf472b6, 0xa855f7, 0x9ca3af, 0x166534,
] as const;

export const WORLD_TEXTS = {
  name: "Mapa Mundi",
  party: "Grupo",
  view: "Ver Mapa Mundi",
  goLive: "Colocar no ar",
  wentLive: "Mapa Mundi colocado no ar para a mesa.",
  backToScene: "Voltar à cena",
  menuLabel: "Ações do Mapa Mundi",
  noTokens: "O Mapa Mundi tem só o token do grupo.",
  stageLabel: "Mapa Mundi com o token do grupo",
  partyMoved: "Grupo movido.",
  tools: "Névoa do Mapa Mundi",
  move: "Mover",
  hide: "Esconder",
  reveal: "Revelar",
  brush: "Pincel",
  hideAll: "Esconder tudo",
  revealAll: "Revelar tudo",
  playerView: "Ver como os jogadores",
  confirmHideTitle: "Esconder o mapa inteiro?",
  confirmHideMessage: "As nuvens cobrem todo o Mapa Mundi para os jogadores.",
  confirmRevealTitle: "Revelar o mapa inteiro?",
  confirmRevealMessage: "As nuvens somem de todo o Mapa Mundi para os jogadores.",
} as const;

/** Brush radius on the world map fog, in world pixels. */
export const WORLD_BRUSH = { min: 10, max: 400, step: 10, default: 60 } as const;

/** Opacity of the fog over the map as the GM sees it (the GM paints over it), unless seeing as the players. */
export const WORLD_FOG_GM_ALPHA = 0.5;

/**
 * How often a fog brush batch is sent while painting (ms): the stroke shows locally at once, so this only paces the
 * traffic (each answer carries the whole mask to the table).
 */
export const WORLD_PAINT_FLUSH_MS = 160;
