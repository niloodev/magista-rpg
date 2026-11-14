import { authErrors, type AuthError } from "@/core/controllers/auth";

export const AUTH_ERROR_STATUS: Record<AuthError, number> = {
  [authErrors.invalidInput]: 400,
  [authErrors.invalidCredentials]: 401,
  [authErrors.sessionNotFound]: 401,
  [authErrors.quickLoginDisabled]: 404,
  [authErrors.quickLoginMissing]: 404,
  [authErrors.unexpected]: 500,
};
