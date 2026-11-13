"use client";

import { useSessionGate } from "./SessionGate.hook";
import type { SessionGateProps } from "./SessionGate.types";

export function SessionGate({ children }: SessionGateProps) {
  const { authenticated } = useSessionGate();
  if (!authenticated) return <div className="min-h-screen bg-void-900" aria-busy="true" />;
  return <>{children}</>;
}
