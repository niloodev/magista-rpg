import { ACCOUNT_PASSWORD_MIN_LENGTH } from "@magista/shared";

export const SESSION_COOKIE_NAME = "magista_session";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export const PASSWORD_LENGTH = 10;

export const JWT_ALGORITHM = "HS256";

export const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$BA5jyEimzHCN87P6DyZmjA$6ssUtb4/mAwpTuSAO4kHkvUVhJGaE+3PFnPMAqqvye0";

export const PASSWORD_MIN_LENGTH = ACCOUNT_PASSWORD_MIN_LENGTH;
