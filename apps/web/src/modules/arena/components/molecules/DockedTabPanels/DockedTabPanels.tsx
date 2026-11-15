import { dockTabKey } from "@/modules/arena/arena.utils";
import { TabPanel } from "@/shared/components/molecules";

import type { DockedTabPanelsProps } from "./DockedTabPanels.types";

/**
 * Tab panels of the sheets docked in a side panel (only the shown one is rendered by `TabPanel`).
 */
export function DockedTabPanels({ idPrefix, docked }: DockedTabPanelsProps) {
  return (
    <>
      {docked.sheets.map((sheet) => (
        <TabPanel
          key={sheet.id}
          idPrefix={idPrefix}
          tabKey={dockTabKey(sheet.id)}
          active={docked.active === sheet.id}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {docked.render(sheet.id)}
        </TabPanel>
      ))}
    </>
  );
}
