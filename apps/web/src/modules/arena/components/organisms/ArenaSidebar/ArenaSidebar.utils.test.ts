import { describe, expect, it, vi } from "vitest";

import { sidebarTabs } from "./ArenaSidebar.utils";

const docked = (active: string | null) => ({
  sheets: [{ id: "c1", name: "Ana" }],
  active,
  onShow: vi.fn(),
  render: () => null,
});

describe("sidebarTabs", () => {
  it("lists the sidebar tabs, hides Mapas from players and adds the docked sheets", () => {
    const player = sidebarTabs({
      showScenes: false,
      tab: "characters",
      docked: docked(null),
      onTabChange: vi.fn(),
    });
    expect(player.items.map((item) => item.label)).toEqual(["Fichas", "Ana"]);
    expect(player.active).toBe("characters");
    const gm = sidebarTabs({
      showScenes: true,
      tab: "scenes",
      docked: docked("c1"),
      onTabChange: vi.fn(),
    });
    expect(gm.items).toHaveLength(3);
    expect(gm.active).toBe("sheet:c1");
  });

  it("shows a docked sheet or goes back to the sidebar's own tab", () => {
    const tabs = docked("c1");
    const onTabChange = vi.fn();
    const { onChange } = sidebarTabs({
      showScenes: true,
      tab: "characters",
      docked: tabs,
      onTabChange,
    });
    onChange("sheet:c1");
    expect(tabs.onShow).toHaveBeenLastCalledWith("c1");
    expect(onTabChange).not.toHaveBeenCalled();
    onChange("scenes");
    expect(tabs.onShow).toHaveBeenLastCalledWith(null);
    expect(onTabChange).toHaveBeenCalledWith("scenes");
  });
});
