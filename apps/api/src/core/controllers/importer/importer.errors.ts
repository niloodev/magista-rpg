export const importerErrors = {
  invalidExport: "Arquivo do Roll20 inválido.",
  loginTaken: "Já existe uma conta de Mestre com este nome.",
  mediaFailed: "Personagem importado, mas não foi possível copiar a imagem.",
  nameTooLong: "Login longo demais (o nome do personagem ou a conta escolhida).",
  unexpected: "Falha inesperada ao importar o personagem.",
} as const;

type ImporterErrorKey = keyof typeof importerErrors;

export type ImporterError = (typeof importerErrors)[ImporterErrorKey];
