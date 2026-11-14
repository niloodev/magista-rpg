export const libraryErrors = {
  gmOnly: "Somente o Mestre organiza as pastas.",
  invalidName: "Informe um nome de pasta de até 60 caracteres.",
  invalidMove: "Movimento inválido.",
  folderNotFound: "Pasta não encontrada.",
  characterNotFound: "Personagem não encontrado.",
  cycle: "Uma pasta não pode ir para dentro dela mesma.",
  unexpected: "Não foi possível organizar as fichas agora. Tente novamente.",
} as const;

type LibraryErrorKey = keyof typeof libraryErrors;

export type LibraryError = (typeof libraryErrors)[LibraryErrorKey];
