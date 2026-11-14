import { Avatar, Icon } from "@/shared/components/atoms";

import type { DragPreviewProps } from "./DragPreview.types";

export function DragPreview({ kind, name, portraitUrl }: DragPreviewProps) {
  return (
    <div className="flex h-full w-full cursor-grabbing items-center gap-3 border border-primary/70 bg-void-800/90 px-4 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.7),0_0_24px_rgba(218,32,84,0.35)] backdrop-blur-md">
      {kind === "folder" ? (
        <Icon name="folder" size={26} aria-hidden="true" className="text-teal-400" />
      ) : (
        <Avatar src={portraitUrl} name={name} size="sm" decorative />
      )}
      <span className="truncate font-serif text-sm tracking-wide text-foreground">{name}</span>
    </div>
  );
}
