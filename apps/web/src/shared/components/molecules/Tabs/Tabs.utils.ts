import { TAB_BASE, TAB_DENSE, TAB_REGULAR, TAB_REGULAR_CONTAINER } from "./Tabs.constants";

/**
 * Id of the tab button and of its panel, so aria-controls/aria-labelledby match.
 */
export function tabIds(prefix: string, key: string) {
  return { tab: `${prefix}-tab-${key}`, panel: `${prefix}-panel-${key}` };
}

/**
 * Layout classes of a tab: dense for sidebars, and measured by the screen or by the nearest container.
 */
export function tabVariantClasses(dense: boolean, container: boolean): string {
  if (container) return `${TAB_BASE.container} ${TAB_REGULAR_CONTAINER}`;
  return `${TAB_BASE.viewport} ${dense ? TAB_DENSE : TAB_REGULAR}`;
}
