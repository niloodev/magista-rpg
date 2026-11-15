import Link from "next/link";

import {
  ARENA_BACK_FULL_LABEL,
  ARENA_BACK_PATH,
  ARENA_MOBILE_TEXTS,
  ARENA_TITLE,
} from "@/modules/arena/arena.constants";
import { Icon } from "@/shared/components/atoms";

import { ArenaNotice } from "../../molecules";

/**
 * What the Arena shows below 1024px: it is built for desktop (mouse, keyboard, a big map), so phones get a
 * pointer back to the table instead of a cramped board (pixi.js is never downloaded there).
 */
export function ArenaMobileNotice() {
  return (
    <main className="relative isolate flex min-h-dvh items-center bg-void-900 py-10">
      <h1 className="sr-only">{ARENA_TITLE}</h1>
      <div aria-hidden="true" className="arena-vignette pointer-events-none absolute inset-0" />
      <ArenaNotice
        icon="swords"
        title={ARENA_MOBILE_TEXTS.title}
        body={ARENA_MOBILE_TEXTS.body}
        className="relative w-full"
        action={
          <Link
            href={ARENA_BACK_PATH}
            className="flex min-h-11 items-center gap-1.5 font-sans text-[15px] text-accent-text underline"
          >
            <Icon name="arrow-left" size={16} aria-hidden="true" />
            {ARENA_BACK_FULL_LABEL}
          </Link>
        }
      />
    </main>
  );
}
