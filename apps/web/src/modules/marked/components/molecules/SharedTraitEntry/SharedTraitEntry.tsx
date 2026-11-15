import { toMediaUrl } from "@/core/services/http";
import { MarkedSigil } from "@/modules/marked/components/atoms";
import { MARKED_TEXTS, STOP_LABEL, UNNAMED_TRAIT } from "@/modules/marked/marked.constants";
import { Avatar, Button, Icon } from "@/shared/components/atoms";
import { ExpandableText } from "@/shared/components/molecules";

import type { SharedTraitEntryProps } from "./SharedTraitEntry.types";

export function SharedTraitEntry({ share, canStop, onStop }: SharedTraitEntryProps) {
  const title = share.trait.name || UNNAMED_TRAIT;
  return (
    <article
      aria-label={`${title}, traço compartilhado pela Marca`}
      className="marked-border p-px shadow-[0_0_28px_rgba(218,32,84,0.25)]"
    >
      <div className="bg-void-800 bg-[linear-gradient(135deg,rgba(92,11,37,0.85),transparent_65%)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <MarkedSigil runes={false} className="mt-0.5 h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 border border-gold-400/50 bg-gold-400/10 px-2 py-0.5 font-sans text-xs font-bold tracking-[0.16em] text-gold-300 uppercase">
                <Icon name="link-2" size={12} />
                {MARKED_TEXTS.fromMark}
              </span>
              <h3 className="mt-1 font-serif text-lg text-gold-200">{title}</h3>
              <div className="mt-1 flex items-center gap-2 font-sans text-sm text-muted-strong">
                <Avatar
                  src={toMediaUrl(share.source.portraitUrl)}
                  name={share.source.name}
                  size="xs"
                  shape="circle"
                  decorative
                />
                <span>
                  {MARKED_TEXTS.sharedBy} {share.source.name}
                </span>
              </div>
            </div>
          </div>
          {canStop && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStop}
              icon={<Icon name="circle-x" size={14} />}
              aria-label={`${MARKED_TEXTS.stop}: ${title}`}
            >
              {STOP_LABEL}
            </Button>
          )}
        </div>
        {share.trait.description && (
          <ExpandableText text={share.trait.description} className="mt-3" />
        )}
      </div>
    </article>
  );
}
