/** Version of the app (the web package), set at build time; bumping it makes every asset and media download again. */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

/** Query parameter that carries the version on asset and media URLs (the server ignores it). */
export const APP_VERSION_PARAM = "v";

/** Where this device remembers the version whose assets it already has. */
export const APP_VERSION_STORAGE_KEY = "magista-app-version";
