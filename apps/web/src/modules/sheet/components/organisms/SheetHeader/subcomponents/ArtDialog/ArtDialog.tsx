"use client";

import Image from "next/image";

import { Button, Icon } from "@/shared/components/atoms";

import { useArtDialog } from "./ArtDialog.hook";
import type { ArtDialogProps } from "./ArtDialog.types";

export function ArtDialog({ src, name }: ArtDialogProps) {
  const { dialogRef, open, close, onBackdropClick } = useArtDialog();
  return (
    <>
      <Button variant="ghost" size="sm" onClick={open} icon={<Icon name="image" size={14} />}>
        Ver arte completa
      </Button>
      <dialog
        ref={dialogRef}
        onClick={onBackdropClick}
        aria-label={`Arte de ${name}`}
        className="m-auto max-h-[90vh] max-w-[min(92vw,900px)] border border-primary/50 bg-void-800 p-0 text-foreground shadow-[0_0_60px_rgba(218,32,84,0.35)] backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
          <span className="font-serif text-lg">{name}</span>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar arte"
            className="flex h-10 w-10 cursor-pointer items-center justify-center text-muted-strong hover:text-foreground"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="bg-white">
          <Image
            src={src}
            alt={`Arte completa de ${name}`}
            width={900}
            height={750}
            unoptimized
            className="h-auto max-h-[80vh] w-full object-contain"
          />
        </div>
      </dialog>
    </>
  );
}
