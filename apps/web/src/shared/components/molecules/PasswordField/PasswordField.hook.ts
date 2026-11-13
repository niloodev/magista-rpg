"use client";

import { useCallback, useState } from "react";

/**
 * Controls the show/hide state of a password field.
 */
export function usePasswordField() {
  const [visible, setVisible] = useState(false);
  const toggleVisible = useCallback(() => setVisible((current) => !current), []);
  return { visible, toggleVisible };
}
