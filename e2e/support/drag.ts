import type { Locator, Page } from "@playwright/test";

/**
 * Drags with the real mouse from the middle of `source` to a vertical point of `target`
 * (0 = top edge, 0.5 = middle, 1 = bottom edge), in small steps so dnd-kit sees the movement.
 */
export async function dragTo(
  page: Page,
  source: Locator,
  target: Locator,
  verticalRatio = 0.5,
  holdMs = 0,
): Promise<void> {
  await source.evaluate((element) => element.scrollIntoView({ block: "center" }));
  const from = await source.boundingBox();
  if (!from) throw new Error("Origem do arraste fora da tela");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 12, { steps: 4 });
  const to = await target.boundingBox();
  if (!to) throw new Error("Destino do arraste fora da tela");
  await page.mouse.move(to.x + to.width / 2, to.y + to.height * verticalRatio, { steps: 20 });
  if (holdMs) await page.waitForTimeout(holdMs);
  await page.mouse.move(to.x + to.width / 2 + 2, to.y + to.height * verticalRatio, { steps: 2 });
  await page.mouse.up();
}

/**
 * Presses keys one by one with a short pause, like a person would. dnd-kit only starts listening to
 * the arrow keys on the tick after the drag is picked up, so keys sent in the same instant are lost.
 */
export async function pressKeys(page: Page, keys: string[], pauseMs = 120): Promise<void> {
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(pauseMs);
  }
}
