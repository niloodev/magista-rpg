"use client";

import type { KeyboardEvent } from "react";

import type { TabsProps } from "./Tabs.types";
import { tabIds } from "./Tabs.utils";

/**
 * WAI-ARIA tabs keyboard model: arrows move and activate, Home/End jump to the ends.
 */
export function useTabs<K extends string>({ items, active, onChange, idPrefix }: TabsProps<K>) {
  const focusTab = (key: K) => {
    onChange(key);
    document.getElementById(tabIds(idPrefix, key).tab)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const visible = items.filter((item) => {
      const element = document.getElementById(tabIds(idPrefix, item.key).tab);
      return element !== null && element.offsetParent !== null;
    });
    const index = visible.findIndex((item) => item.key === active);
    const moves: Record<string, number | undefined> = {
      ArrowRight: (index + 1) % visible.length,
      ArrowLeft: (index - 1 + visible.length) % visible.length,
      Home: 0,
      End: visible.length - 1,
    };
    const next = moves[event.key];
    const target = next === undefined ? undefined : visible[next];
    if (!target) return;
    event.preventDefault();
    focusTab(target.key);
  };

  return { onKeyDown };
}
