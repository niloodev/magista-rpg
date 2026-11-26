import type { ISocketTarget } from "./socket.types";

/**
 * Where the table socket connects for a given API URL. An absolute URL (development, `http://localhost:3333`)
 * is the socket server itself, on the default path. A relative one (production, `/api` behind the proxy) means the
 * API shares the page origin under that prefix: the socket connects to the page origin on `<prefix>/socket.io`,
 * since socket.io would read a path in the URL as a namespace.
 */
export function socketTarget(apiUrl: string): ISocketTarget {
  if (/^https?:\/\//.test(apiUrl)) return { url: apiUrl, path: "/socket.io" };
  const prefix = apiUrl.replace(/\/+$/, "");
  return { url: undefined, path: `${prefix}/socket.io` };
}
