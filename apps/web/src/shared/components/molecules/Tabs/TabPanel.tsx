import type { TabPanelProps } from "./Tabs.types";
import { tabIds } from "./Tabs.utils";

export function TabPanel({ idPrefix, tabKey, active, children, className }: TabPanelProps) {
  const ids = tabIds(idPrefix, tabKey);
  return (
    <div
      id={ids.panel}
      role="tabpanel"
      aria-labelledby={ids.tab}
      hidden={!active}
      tabIndex={-1}
      className={className}
    >
      {active && children}
    </div>
  );
}
