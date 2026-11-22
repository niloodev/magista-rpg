export const arenaWorldErrors = {
  gmOnly: "Somente o Mestre pode fazer isso.",
  invalidMove: "Posição inválida.",
  invalidPaint: "Pincel inválido.",
  invalidLive: "Pedido inválido.",
  notLive: "O Mapa Mundi não está no ar.",
  unexpected: "Não foi possível atualizar o Mapa Mundi. Tente de novo.",
} as const;

export type ArenaWorldError = (typeof arenaWorldErrors)[keyof typeof arenaWorldErrors];
