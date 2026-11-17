export const arenaTurnErrors = {
  invalidCommand: "Comando de turno inválido.",
  gmOnly: "Somente o Mestre pode fazer isso.",
  sceneNotFound: "Cena não encontrada.",
  notLive: "A ordem de turnos só vale na cena que está no ar.",
  tokenNotFound: "Token não encontrado.",
  forbidden: "Você não controla este token.",
  unexpected: "Não foi possível mudar a ordem de turnos. Tente de novo.",
} as const;

export type ArenaTurnError = (typeof arenaTurnErrors)[keyof typeof arenaTurnErrors];
