import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { SessionGate } from "@/modules/auth/components/organisms";
import { RouteSkeleton } from "@/modules/shell/components";
import { HINTS_COOKIE, parseHints, SkeletonHintsProvider } from "@/modules/shell/providers";
import { TableSocketProvider } from "@/modules/table/providers";

export default async function TableLayout({ children }: { children: ReactNode }) {
  const hints = parseHints((await cookies()).get(HINTS_COOKIE)?.value);
  return (
    <SkeletonHintsProvider initial={hints}>
      <SessionGate fallback={<RouteSkeleton />}>
        <TableSocketProvider>{children}</TableSocketProvider>
      </SessionGate>
    </SkeletonHintsProvider>
  );
}
