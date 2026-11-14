/**
 * Id of the tab button and of its panel, so aria-controls/aria-labelledby match.
 */
export function tabIds(prefix: string, key: string) {
  return { tab: `${prefix}-tab-${key}`, panel: `${prefix}-panel-${key}` };
}
