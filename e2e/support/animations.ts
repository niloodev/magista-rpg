import type { Page } from "@playwright/test";

/**
 * Waits for every finite CSS animation on the page (modal pop-in, fades) to finish, so checks such
 * as color contrast measure the final state instead of a half transparent frame.
 */
export async function settleAnimations(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}
