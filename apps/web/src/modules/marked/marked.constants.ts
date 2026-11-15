export const MARKED_RULES = [
  {
    title: "Compartilhamento de Traços",
    text: "Uma vez por rodada, um Marcado pode compartilhar um traço com os outros Marcados até o fim da cena (1x por descanso longo). Todos precisam aceitar.",
  },
  {
    title: "Bônus Coletivo",
    text: "Enquanto a Marca vive em você, todos os seus testes de d20 recebem +2 (atributos, perícias, iniciativa, bloqueios e ataques).",
  },
] as const;

export const MARKED_TEXTS = {
  panelTitle: "Alma de Marcado",
  share: "Compartilhar traço",
  stop: "Encerrar compartilhamento",
  reopen: "Responder pedido da Marca",
  noShare: "Nenhum traço compartilhado pela Marca agora.",
  noTraits: "Esta ficha não tem traços para compartilhar.",
  pendingBlock: "Há um pedido da Marca aguardando resposta.",
  shareBlock: "Encerre o traço ativo antes de compartilhar outro.",
  activeLabel: "Traço ativo da Marca",
  sharedBy: "compartilhado por",
  fromMark: "Pela Marca",
  stopConfirmTitle: "Encerrar o traço da Marca?",
  stopConfirmMessage: "O traço some da ficha de todos os Marcados.",
} as const;

/** Rune strokes drawn in a 12x20 box centered on the origin (fonts rarely carry the runic block). */
export const MARKED_RUNE_PATHS = [
  "M0 -9V9M0 -9L6 -3M0 -3L6 3",
  "M-4 -9V9M-4 -9L4 -1L-4 7",
  "M0 -9V9M-5 -4L5 4",
  "M-4 -9V9M4 -9V9M-4 -9L4 0",
  "M0 -9V9M0 -2L-5 -8M0 -2L5 -8",
  "M-5 -9L5 9M5 -9L-5 9",
  "M0 -9L5 0L0 9L-5 0Z",
  "M-5 9L0 -9L5 9M-2.5 2H2.5",
  "M0 -9V9M-5 -9L5 -3M-5 3L5 9",
  "M-5 -9V9M5 -9V9M-5 -9L5 9",
] as const;

export const MARKED_RISING_RUNES = [
  { rune: 0, left: "8%", delay: "0s", size: "h-8" },
  { rune: 4, left: "22%", delay: "-5s", size: "h-6" },
  { rune: 6, left: "37%", delay: "-9s", size: "h-10" },
  { rune: 1, left: "55%", delay: "-2s", size: "h-6" },
  { rune: 9, left: "68%", delay: "-11s", size: "h-8" },
  { rune: 5, left: "81%", delay: "-7s", size: "h-6" },
  { rune: 7, left: "93%", delay: "-3s", size: "h-8" },
] as const;

export const OUTCOME_TEXTS = {
  accepted: {
    title: "A Marca se uniu",
    message: "Todos aceitaram. O traço está na ficha de cada Marcado.",
  },
  declined: { title: "A Marca recusou", message: "recusou o compartilhamento." },
  expired: { title: "O chamado se perdeu", message: "não respondeu a tempo." },
  cancelled: { title: "Compartilhamento cancelado", message: "O pedido foi retirado." },
} as const;

export const STATUS_LABELS = {
  pending: "Aguardando",
  accepted: "Aceitou",
  declined: "Recusou",
} as const;

export const MARKED_COUNTDOWN_TICK_MS = 1000;

export const MARKED_STALE_GRACE_MS = 5000;

export const UNNAMED_TRAIT = "Sem nome";

export const STOP_LABEL = "Encerrar";
