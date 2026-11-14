"use client";

import { Icon } from "@/shared/components/atoms";

import { useRootDropZone } from "./RootDropZone.hook";
import type { RootDropZoneProps } from "./RootDropZone.types";

export function RootDropZone({ dropId, active, dragging }: RootDropZoneProps) {
  const { setNodeRef } = useRootDropZone(dropId);
  return (
    <div
      ref={setNodeRef}
      data-testid="library-root-drop"
      className={`flex min-h-11 items-center gap-2 border px-3 font-serif text-sm tracking-wide transition-colors duration-200 ${active ? "border-teal-300 bg-teal-900/50 text-foreground" : dragging ? "border-dashed border-white/25 text-muted-strong" : "border-transparent border-b-white/10 text-muted-strong"}`}
    >
      <Icon name="house" size={16} aria-hidden="true" />
      {dragging ? "Solte aqui para tirar da pasta (raiz)" : "Todas as fichas"}
    </div>
  );
}
