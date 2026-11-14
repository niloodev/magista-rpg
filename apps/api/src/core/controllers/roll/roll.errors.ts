export const rollErrors = {
  invalidRequest: "Rolagem inválida.",
  notFound: "Personagem ou habilidade não encontrado.",
  forbidden: "Você não pode rolar por este personagem.",
  invalidExpression: "Expressão de dados inválida. Use algo como 1d20 + 3.",
  gmOnly: "Somente o Mestre pode subir o nível.",
  maxLevel: "O personagem já está no nível máximo.",
  conflict: "A ficha mudou durante a subida de nível. Tente de novo.",
  unexpected: "Não foi possível rolar agora. Tente novamente.",
} as const;

type RollErrorKey = keyof typeof rollErrors;

export type RollError = (typeof rollErrors)[RollErrorKey];
