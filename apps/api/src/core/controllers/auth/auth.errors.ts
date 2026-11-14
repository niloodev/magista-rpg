export const authErrors = {
  invalidInput: "Preencha todos os campos.",
  invalidCredentials: "Conta ou senha inválidos.",
  sessionNotFound: "Sessão expirada. Entre novamente.",
  quickLoginDisabled: "Rota não encontrada.",
  quickLoginMissing: "Conta de teste não encontrada. Rode o seed (npm run db:seed).",
  unexpected: "Não foi possível acessar a ficha agora. Tente novamente.",
} as const;

type AuthErrorKey = keyof typeof authErrors;

export type AuthError = (typeof authErrors)[AuthErrorKey];
