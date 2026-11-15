"use client";

import { useCallback } from "react";

import { openPopout } from "@/core/services/windows";

import type { PopoutButtonProps } from "./PopoutButton.types";

/**
 * Opens the target screen in its own window.
 */
export function usePopoutButton({ target }: Pick<PopoutButtonProps, "target">) {
  const { kind, id } = target;
  const onOpen = useCallback(() => void openPopout({ kind, id }), [kind, id]);
  return { onOpen };
}
