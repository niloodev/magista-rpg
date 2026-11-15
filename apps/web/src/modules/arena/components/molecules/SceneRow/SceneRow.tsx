import Image from "next/image";

import { SCENE_TEXTS } from "@/modules/arena/arena.constants";
import { DropIndicator } from "@/modules/library/components/molecules";
import { Icon } from "@/shared/components/atoms";

import type { SceneRowProps } from "./SceneRow.types";

/**
 * A scene in the GM library: map thumbnail, name and state ("Ao vivo" for the scene the table sees,
 * "Vendo agora" for the one on the GM screen). Clicking the name opens the scene on the GM screen.
 */
export function SceneRow({
  name,
  hasMap,
  thumbUrl,
  live,
  viewing,
  onOpen,
  actions,
  handle,
  dropPosition = null,
  dimmed = false,
}: SceneRowProps) {
  return (
    <div
      className={`group relative flex min-h-14 items-center gap-2.5 border py-1.5 pr-1.5 pl-1.5 transition-[border-color,background-color,opacity] duration-200 focus-within:z-20 focus-within:border-primary/60 hover:border-primary/50 ${viewing ? "border-gold-400/60 bg-[linear-gradient(90deg,rgba(120,72,6,0.22),rgba(0,0,0,0.5))]" : "border-white/10 bg-gradient-to-r from-void-700/70 to-black/50"} ${dimmed ? "opacity-40" : ""}`}
    >
      {dropPosition && dropPosition !== "inside" && <DropIndicator position={dropPosition} />}
      {handle}
      <span className="relative flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-void-800">
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            alt=""
            fill
            sizes="64px"
            unoptimized
            loading="lazy"
            decoding="async"
            draggable={false}
            className="object-cover"
          />
        ) : (
          <Icon name="map" size={18} aria-hidden="true" className="text-muted-strong" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-serif text-[15px] tracking-wide text-foreground">
          <button
            type="button"
            onClick={onOpen}
            aria-current={viewing ? "true" : undefined}
            title={name}
            className="block max-w-full cursor-pointer truncate text-left after:absolute after:inset-0 after:z-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ruby-400 focus-visible:after:outline-solid"
          >
            {name}
          </button>
        </h3>
        <p className="flex items-center gap-2 font-sans text-xs text-muted-strong">
          {live && (
            <span className="inline-flex items-center gap-1.5 font-semibold tracking-wider text-teal-300 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" aria-hidden="true" />
              {SCENE_TEXTS.live}
            </span>
          )}
          {viewing && !live && (
            <span className="font-semibold tracking-wider text-gold-300 uppercase">
              {SCENE_TEXTS.viewing}
            </span>
          )}
          {!hasMap && <span className="italic">{SCENE_TEXTS.noMap}</span>}
        </p>
      </div>
      <div className="relative z-10 flex items-center">{actions}</div>
    </div>
  );
}
