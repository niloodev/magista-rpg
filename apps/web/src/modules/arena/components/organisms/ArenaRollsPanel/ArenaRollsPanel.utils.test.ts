import { describe, expect, it, vi } from "vitest";

import { rollsPanelTabs } from "./ArenaRollsPanel.utils";

describe("rollsPanelTabs", () => {
  it("always has Rolagens first, then the docked sheets", () => {
    const onShow = vi.fn();
    expect(
      rollsPanelTabs({ sheets: [], active: null, onShow, render: () => null }).items,
    ).toHaveLength(1);
    const tabs = rollsPanelTabs({
      sheets: [{ id: "c1", name: null }],
      active: null,
      onShow,
      render: () => null,
    });
    expect(tabs.items.map((item) => item.label)).toEqual(["Rolagens", "Ficha"]);
    expect(tabs.active).toBe("rolls");
    tabs.onChange("sheet:c1");
    expect(onShow).toHaveBeenCalledWith("c1");
  });
});
