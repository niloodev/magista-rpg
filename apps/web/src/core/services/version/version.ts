import { APP_VERSION, APP_VERSION_PARAM, APP_VERSION_STORAGE_KEY } from "./version.constants";

/**
 * A URL of an asset or media file tagged with the app version, so the browser keeps it cached for good and
 * downloads it again only when the version goes up (the server ignores the parameter).
 */
export function versionedUrl(url: string, version: string = APP_VERSION): string {
  const [base = "", hash] = url.split("#");
  const separator = base.includes("?") ? "&" : "?";
  const tagged = `${base}${separator}${APP_VERSION_PARAM}=${encodeURIComponent(version)}`;
  return hash === undefined ? tagged : `${tagged}#${hash}`;
}

/** The version whose assets this device already loaded (null on the first visit or without storage). */
export function storedAppVersion(): string | null {
  try {
    return window.localStorage.getItem(APP_VERSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Remembers that this device has the assets of the current version. */
export function rememberAppVersion(): void {
  try {
    window.localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION);
  } catch {
    return;
  }
}
