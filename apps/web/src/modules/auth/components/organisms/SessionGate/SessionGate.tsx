"use client";

import { useSessionGate } from "./SessionGate.hook";
import type { SessionGateProps } from "./SessionGate.types";

export function SessionGate({ children, fallback }: SessionGateProps) {
  const { authenticated } = useSessionGate();
  if (!authenticated) return <>{fallback}</>;
  return <>{children}</>;
}
