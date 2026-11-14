export const importerErrors = {
  invalidExport: "Arquivo do Roll20 inválido.",
  loginTaken: "Já existe uma conta de Mestre com este nome.",
  mediaFailed: "Personagem importado, mas não foi possível copiar a imagem.",
  nameTooLong: "Nome do personagem longo demais para ser usado como login.",
  unexpected: "Falha inesperada ao importar o personagem.",
} as const;

type ImporterErrorKey = keyof typeof importerErrors;

export type ImporterError = (typeof importerErrors)[ImporterErrorKey];
