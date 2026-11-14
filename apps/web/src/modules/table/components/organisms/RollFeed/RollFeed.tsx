"use client";

import { Icon, Skeleton } from "@/shared/components/atoms";
import { Panel, SkeletonRegion } from "@/shared/components/molecules";

import { FEED_LOADING_LABEL } from "./RollFeed.constants";
import { useRollFeed } from "./RollFeed.hook";
import type { RollFeedProps } from "./RollFeed.types";
import { RollCard, RollCardSkeleton } from "./subcomponents";

/**
 * Table roll history. With `loading` (history not received yet) it draws skeleton cards in the shape of the
 * last feed seen on this device instead of a false "no rolls yet".
 */
export function RollFeed(props: RollFeedProps) {
  const { rolls, className, nested = false } = props;
  const { shape, showSkeleton, showEmpty, countLabel, countSample, TitleTag } = useRollFeed(props);
  return (
    <Panel variant="inner" className={`flex min-h-0 flex-col ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <TitleTag className="flex items-center gap-2 font-sans text-[15px] font-bold tracking-[0.18em] text-accent-text uppercase">
          <Icon name="dices" size={16} />
          Rolagens da mesa
        </TitleTag>
        {showSkeleton ? (
          <span className="font-sans text-xs">
            <Skeleton shape="glyphs">{countSample}</Skeleton>
          </span>
        ) : (
          countLabel && <span className="font-sans text-xs text-muted-strong">{countLabel}</span>
        )}
      </div>
      {showSkeleton ? (
        <SkeletonRegion
          label={FEED_LOADING_LABEL}
          announce={!nested}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <ol
            aria-hidden="true"
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 [scrollbar-gutter:stable]"
          >
            {shape.cards.map((card, index) => (
              <RollCardSkeleton key={index} card={card} />
            ))}
          </ol>
        </SkeletonRegion>
      ) : showEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 rotate-45 items-center justify-center border border-primary/30 bg-primary/5"
          >
            <Icon name="dices" size={22} className="-rotate-45 text-accent-text/70" />
          </span>
          <p className="font-sans text-[15px] text-muted-strong">Nenhuma rolagem ainda.</p>
          <p className="font-sans text-sm text-muted-strong/80">
            Clique em um atributo, perícia, bloqueio ou habilidade para rolar.
          </p>
        </div>
      ) : (
        <ol
          tabIndex={0}
          aria-label="Histórico de rolagens, mais recentes primeiro"
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 [scrollbar-gutter:stable] focus-visible:outline-offset-[-2px]"
          aria-live="polite"
          aria-relevant="additions"
        >
          {rolls.map((roll) => (
            <RollCard key={roll.id} roll={roll} />
          ))}
        </ol>
      )}
    </Panel>
  );
}
