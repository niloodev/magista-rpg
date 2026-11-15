import type { Metadata } from "next";

import { ArenaPage } from "@/modules/arena/components/pages";

export const metadata: Metadata = { title: "Arena · Magista" };

export default function Page() {
  return <ArenaPage />;
}
