import { SESSION_COOKIE_NAME } from "@magista/shared";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { SessionGate } from "@/modules/auth/components/organisms";
import { MarkedProvider } from "@/modules/marked/providers";
import { RouteSkeleton } from "@/modules/shell/components";
import { HINTS_COOKIE, parseHints, SkeletonHintsProvider } from "@/modules/shell/providers";
import { TableSocketProvider } from "@/modules/table/providers";

export default async function TableLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  if (!jar.has(SESSION_COOKIE_NAME)) redirect("/login");
  const hints = parseHints(jar.get(HINTS_COOKIE)?.value);
  return (
    <SkeletonHintsProvider initial={hints}>
      <SessionGate fallback={<RouteSkeleton />}>
        <TableSocketProvider>
          <MarkedProvider>{children}</MarkedProvider>
        </TableSocketProvider>
      </SessionGate>
    </SkeletonHintsProvider>
  );
}
