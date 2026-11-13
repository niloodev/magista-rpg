import type { ReactNode } from "react";

import { SessionGate } from "@/modules/auth/components/organisms";

export default function TableLayout({ children }: { children: ReactNode }) {
  return <SessionGate>{children}</SessionGate>;
}
