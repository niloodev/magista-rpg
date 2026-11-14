import type { Page } from "@playwright/test";

export type SectionBoxes = Record<string, string[]>;

/**
 * Reads `height x width` of every element matching each selector, to compare a skeleton with the loaded screen
 * (position is left out: data above a section, like an optional button, may shift it).
 */
export async function sectionBoxes(
  page: Page,
  selectors: Record<string, string>,
): Promise<SectionBoxes> {
  return page.evaluate((entries) => {
    const result: Record<string, string[]> = {};
    for (const [name, selector] of Object.entries(entries)) {
      result[name] = Array.from(document.querySelectorAll(selector)).map((element) => {
        const box = element.getBoundingClientRect();
        return `${Math.round(box.height)}x${Math.round(box.width)}`;
      });
    }
    return result;
  }, selectors);
}
