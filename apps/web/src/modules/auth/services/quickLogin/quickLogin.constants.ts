export const QUICK_LOGIN_ENABLED =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_QUICK_LOGIN === "true";
