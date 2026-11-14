import { accountErrors, type AccountError } from "@/core/controllers/account";

export const ACCOUNT_ERROR_STATUS: Record<AccountError, number> = {
  [accountErrors.invalidInput]: 400,
  [accountErrors.invalidNewAccount]: 400,
  [accountErrors.loginTaken]: 409,
  [accountErrors.gmOnly]: 403,
  [accountErrors.notFound]: 404,
  [accountErrors.unexpected]: 500,
};
