import type { Metadata } from "next";

import { ArenaPage } from "@/modules/arena/components/pages";
import { preloadArenaAssets } from "@/modules/arena/services/arenaPreload";

export const metadata: Metadata = { title: "Arena · Magista" };

export default function Page() {
  preloadArenaAssets();
  return <ArenaPage />;
}
