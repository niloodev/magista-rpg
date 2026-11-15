import Link from "next/link";

import {
  ARENA_BACK_LABEL,
  ARENA_BACK_PATH,
  ARENA_BACK_PREFIX,
  ARENA_MEMBERS_LABEL,
  ARENA_TITLE,
} from "@/modules/arena/arena.constants";
import { Button, Icon, Text } from "@/shared/components/atoms";

import { ArenaConnectionStatus } from "../../molecules";
import { ARENA_BACK_LINK_CLASSES, ARENA_TOP_BAR_CLASSES } from "./ArenaTopBar.constants";
import type { ArenaTopBarProps } from "./ArenaTopBar.types";

export function ArenaTopBar({ sceneName, status, memberCount, onOpenProfile }: ArenaTopBarProps) {
  return (
    <header className={ARENA_TOP_BAR_CLASSES}>
      <Link href={ARENA_BACK_PATH} className={ARENA_BACK_LINK_CLASSES}>
        <Icon name="arrow-left" size={16} aria-hidden="true" />
        <span className="sr-only">{ARENA_BACK_PREFIX}</span>
        <span className="max-sm:sr-only">{ARENA_BACK_LABEL}</span>
      </Link>
      <span aria-hidden="true" className="h-6 w-px shrink-0 bg-border" />
      <div className="min-w-0 flex-1">
        {sceneName && (
          <Text variant="micro" className="block leading-4">
            {ARENA_TITLE}
          </Text>
        )}
        <h1 className="truncate font-serif text-lg leading-6 text-foreground">
          {sceneName ?? ARENA_TITLE}
        </h1>
      </div>
      <ArenaConnectionStatus status={status} />
      <span className="flex shrink-0 items-center gap-1.5 font-sans text-sm text-muted-strong">
        <Icon name="users" size={16} aria-hidden="true" />
        <span className="sr-only">{ARENA_MEMBERS_LABEL(memberCount)}</span>
        <span aria-hidden="true">{memberCount}</span>
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={onOpenProfile}
        icon={<Icon name="user" size={12} />}
        className="shrink-0"
      >
        <span className="max-sm:sr-only">Perfil</span>
      </Button>
    </header>
  );
}
