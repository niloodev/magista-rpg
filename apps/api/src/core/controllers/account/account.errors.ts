export const accountErrors = {
  invalidInput:
    "Informe o login e uma senha com pelo menos 10 caracteres (ou deixe em branco para gerar uma).",
  invalidNewAccount:
    "Informe um login de 2 a 64 caracteres e, se quiser, uma senha com pelo menos 10 caracteres.",
  loginTaken: "Já existe uma conta com esse login.",
  gmOnly: "Somente o Mestre gerencia contas.",
  notFound: "Conta não encontrada.",
  unexpected: "Não foi possível alterar a conta.",
} as const;

type AccountErrorKey = keyof typeof accountErrors;

export type AccountError = (typeof accountErrors)[AccountErrorKey];
