export const characterErrors = {
  notFound: "Personagem não encontrado.",
  forbidden: "Você não tem acesso a esta ficha.",
  gmOnly: "Somente o Mestre pode fazer isso.",
  invalidSheet: "Ficha inválida. Confira os campos e tente novamente.",
  invalidName: "Informe um nome de até 80 caracteres.",
  invalidAccess: "Lista de contas inválida.",
  folderNotFound: "Pasta não encontrada.",
  accountNotFound: "Uma das contas escolhidas não existe ou não é de jogador.",
  gmOnlyFields: "Somente o Mestre altera classe, nível, vida máxima e sanidade máxima.",
  aboveMaximum: "Vida e Sanidade atuais não podem passar do máximo.",
  conflict: "A ficha foi alterada em outro lugar. Recarregando a versão mais nova.",
  unexpected: "Não foi possível acessar a ficha agora. Tente novamente.",
} as const;

type CharacterErrorKey = keyof typeof characterErrors;

export type CharacterError = (typeof characterErrors)[CharacterErrorKey];
