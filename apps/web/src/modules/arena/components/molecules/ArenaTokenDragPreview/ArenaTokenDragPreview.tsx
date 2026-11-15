import Image from "next/image";

import { tokenPreviewDiameter } from "./ArenaTokenDragPreview.utils";
import type { ArenaTokenDragPreviewProps } from "./ArenaTokenDragPreview.types";

/**
 * A sheet dragged over the Arena map, drawn as the token it is about to become: portrait in a ring at the size
 * the token will have on the map, with the name below, translucent so it reads as a preview.
 */
export function ArenaTokenDragPreview({ name, portraitUrl, size }: ArenaTokenDragPreviewProps) {
  const diameter = tokenPreviewDiameter(size);
  return (
    <div className="flex flex-col items-center gap-1 opacity-55">
      <span
        className="relative flex items-center justify-center overflow-hidden rounded-full border-[3px] border-teal-400 bg-void-800 shadow-[0_8px_24px_rgba(0,0,0,0.6),0_0_18px_rgba(45,212,191,0.45)]"
        style={{ width: diameter, height: diameter }}
      >
        {portraitUrl ? (
          <Image src={portraitUrl} alt="" fill sizes="200px" unoptimized className="object-cover" />
        ) : (
          <span className="font-serif text-2xl text-accent-text">{name.charAt(0)}</span>
        )}
      </span>
      <span className="font-serif text-sm tracking-wide text-foreground [text-shadow:0_0_4px_#000,0_0_8px_#000]">
        {name}
      </span>
    </div>
  );
}
