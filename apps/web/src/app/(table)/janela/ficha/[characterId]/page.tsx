import type { Metadata } from "next";

import { SheetPage } from "@/modules/sheet/components/pages";

export const metadata: Metadata = { title: "Ficha · Magista" };

export default async function Page({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = await params;
  return <SheetPage characterId={characterId} variant="window" />;
}
