import { memo } from "react";

import Link from "next/link";

import {
  ARENA_BACK_LABEL,
  ARENA_BACK_PATH,
  ARENA_BACK_PREFIX,
  ARENA_MEMBERS_LABEL,
  ARENA_PREVIEW_TEXTS,
  ARENA_TITLE,
  ARENA_TURN_TEXTS,
} from "@/modules/arena/arena.constants";
import { Button, Icon, Text } from "@/shared/components/atoms";

import { ArenaConnectionStatus } from "../../molecules";
import {
  ARENA_BACK_LINK_CLASSES,
  ARENA_TOP_BAR_CLASSES,
  ARENA_TURNS_BADGE_CLASSES,
  ARENA_TURNS_BUTTON_OPEN,
} from "./ArenaTopBar.constants";
import type { ArenaTopBarProps } from "./ArenaTopBar.types";

export const ArenaTopBar = memo(function ArenaTopBar({
  sceneName,
  status,
  memberCount,
  broadcast,
  onGoLive,
  onBackToLive,
  onOpenProfile,
  turns,
}: ArenaTopBarProps) {
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
      {broadcast?.live && (
        <span className="flex shrink-0 items-center gap-1.5 border border-teal-500/50 bg-teal-900/30 px-2.5 py-1 font-sans text-xs font-semibold tracking-[0.12em] text-teal-200 uppercase">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal-400" />
          {ARENA_PREVIEW_TEXTS.live}
        </span>
      )}
      {broadcast && !broadcast.live && (
        <div className="flex shrink-0 items-center gap-2">
          <span
            title={ARENA_PREVIEW_TEXTS.previewHint}
            className="flex items-center gap-1.5 border border-gold-400/60 bg-gold-700/20 px-2.5 py-1 font-sans text-xs font-semibold tracking-[0.12em] text-gold-200 uppercase"
          >
            <Icon name="eye" size={13} aria-hidden="true" />
            {ARENA_PREVIEW_TEXTS.preview}
            <span className="sr-only">: {ARENA_PREVIEW_TEXTS.previewHint}</span>
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={onGoLive}
            icon={<Icon name="zap" size={12} />}
          >
            {ARENA_PREVIEW_TEXTS.goLive}
          </Button>
          {broadcast.hasLive && (
            <Button variant="ghost" size="sm" onClick={onBackToLive}>
              {ARENA_PREVIEW_TEXTS.backToLive}
            </Button>
          )}
        </div>
      )}
      {turns && (
        <Button
          variant="secondary"
          size="sm"
          onClick={turns.onToggle}
          aria-pressed={turns.open}
          icon={<Icon name="list-ordered" size={12} />}
          className={`relative shrink-0 ${turns.open ? ARENA_TURNS_BUTTON_OPEN : ""}`}
        >
          <span className="max-sm:sr-only">{ARENA_TURN_TEXTS.button}</span>
          {turns.yourTurn && (
            <>
              <span aria-hidden="true" className={ARENA_TURNS_BADGE_CLASSES} />
              <span className="sr-only"> ({ARENA_TURN_TEXTS.buttonYourTurn})</span>
            </>
          )}
        </Button>
      )}
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
});
