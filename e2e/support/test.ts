import { test as base } from "@playwright/test";

/**
 * The Playwright `test` with one addition: every browser context a test opens by hand
 * (`browser.newContext()`, for a second account) is closed when the test ends, so pages from earlier tests do
 * not keep running (sockets, the Arena) and slow down the rest of the suite.
 */
export const test = base.extend<{ closeExtraContexts: void }>({
  closeExtraContexts: [
    async ({ browser, context }, use) => {
      await use();
      await Promise.all(
        browser
          .contexts()
          .filter((open) => open !== context)
          .map((open) => open.close()),
      );
    },
    { auto: true },
  ],
});
