export const authErrors = {
  invalidInput: "Preencha todos os campos.",
  invalidCredentials: "Personagem ou senha inválidos.",
  sessionNotFound: "Sessão expirada. Entre novamente.",
  unexpected: "Não foi possível acessar a ficha agora. Tente novamente.",
} as const;

type AuthErrorKey = keyof typeof authErrors;

export type AuthError = (typeof authErrors)[AuthErrorKey];
