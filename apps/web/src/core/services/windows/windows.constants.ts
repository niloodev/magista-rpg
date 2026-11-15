/**
 * Routes that render a screen without the page chrome, to live in its own browser window
 * (and, later, as floating panels of the Arena). New kinds are registered here.
 */
export const POPOUT_ROUTES = {
  sheet: (id: string) => `/janela/ficha/${id}`,
} as const;

export const POPOUT_PATH_PREFIX = "/janela/";

export const POPOUT_FEATURES = "popup,width=560,height=900";
