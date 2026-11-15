import { describe, expect, it, vi } from "vitest";

import { POPOUT_FEATURES } from "./windows.constants";
import { openPopout } from "./windows";
import { popoutName, popoutUrl } from "./windows.utils";

const target = { kind: "sheet", id: "abc" } as const;

describe("popout windows", () => {
  it("maps each kind to its window route and a stable window name", () => {
    expect(popoutUrl(target)).toBe("/janela/ficha/abc");
    expect(popoutName(target)).toBe("magista-sheet-abc");
  });

  it("opens (or reuses) the named popup and focuses it", () => {
    const focus = vi.fn();
    const host = { open: vi.fn().mockReturnValue({ focus }) };
    expect(openPopout(target, host)).toBe(true);
    expect(host.open).toHaveBeenCalledWith(
      "/janela/ficha/abc",
      "magista-sheet-abc",
      POPOUT_FEATURES,
    );
    expect(focus).toHaveBeenCalled();
  });

  it("falls back to a new tab when popups are blocked", () => {
    const host = {
      open: vi.fn().mockReturnValueOnce(null).mockReturnValueOnce({ focus: vi.fn() }),
    };
    expect(openPopout(target, host)).toBe(true);
    expect(host.open).toHaveBeenLastCalledWith("/janela/ficha/abc", "_blank", "");
  });
});
