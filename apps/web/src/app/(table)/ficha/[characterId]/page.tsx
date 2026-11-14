import { SheetPage } from "@/modules/sheet/components/pages";

export default async function Page({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = await params;
  return <SheetPage characterId={characterId} />;
}
