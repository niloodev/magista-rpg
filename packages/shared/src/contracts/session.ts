/**
 * Name of the httpOnly session cookie: set by the API, and read by the web server only to send a visitor without
 * it straight to the login (the session itself is always checked by the API).
 */
export const SESSION_COOKIE_NAME = "magista_session";
