import type { Page, Route } from "@playwright/test";

import { API_URL } from "./env";

/**
 * Holds every API request whose path matches `pattern` until `release()` is called, so loading states stay on screen.
 * Released requests fall back to earlier `page.route` handlers (mocks) or the network.
 */
export async function holdApi(page: Page, pattern: RegExp): Promise<() => Promise<void>> {
  const held: Route[] = [];
  let open = false;
  const origin = new URL(API_URL).origin;
  const matches = (url: URL) => url.origin === origin && pattern.test(url.pathname);
  const handler = async (route: Route) => {
    if (open) return route.fallback();
    held.push(route);
  };
  await page.route(matches, handler);
  return async () => {
    open = true;
    await Promise.all(held.splice(0).map((route) => route.fallback()));
    await page.unroute(matches, handler);
  };
}
