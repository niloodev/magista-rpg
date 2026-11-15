export const markedErrors = {
  invalidRequest: "Pedido da Marca inválido.",
  forbidden: "Você não pode agir por esta ficha.",
  notMarked: "Só fichas Marcadas compartilham traços pela Marca.",
  traitNotFound: "Traço não encontrado na ficha salva.",
  noOtherMarked: "Não há outros Marcados para receber o traço.",
  targetOffline: "Algum Marcado não está na mesa agora. Todos precisam estar presentes.",
  shareActive: "Já há um traço da Marca ativo. Encerre-o antes de compartilhar outro.",
  proposalPending: "Já há um compartilhamento aguardando resposta.",
  proposalNotFound: "Este pedido de compartilhamento não está mais ativo.",
  notTarget: "Esta ficha não precisa responder a este pedido.",
  alreadyAnswered: "Esta ficha já respondeu.",
  shareNotFound: "Este traço da Marca já foi encerrado.",
  unexpected: "Não foi possível falar com a Marca agora. Tente novamente.",
} as const;

type MarkedErrorKey = keyof typeof markedErrors;

export type MarkedError = (typeof markedErrors)[MarkedErrorKey];
