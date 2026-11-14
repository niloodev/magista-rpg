import { Skeleton, Text } from "@/shared/components/atoms";
import { Panel, SkeletonRegion } from "@/shared/components/molecules";

import {
  CONNECTION_STATUSES,
  PRESENCE_LOADING_LABEL,
  PRESENCE_TITLE,
  STATUS_DOT,
  STATUS_LABELS,
} from "./PresencePanel.constants";
import type { PresencePanelProps } from "./PresencePanel.types";
import { PresenceMember, PresenceMemberSkeleton } from "./subcomponents";

/**
 * Who is at the table. With `loadingRows` (live presence not arrived yet) it shows that many placeholder rows.
 * The status keeps the width of its longest label (drawn by invisible pseudo-elements, not DOM text), so the
 * header never changes size when the connection changes.
 */
export function PresencePanel({
  status,
  members,
  loadingRows = [],
  titleAs = "h2",
  nested = false,
}: PresencePanelProps) {
  const waiting = loadingRows.length > 0;
  return (
    <Panel variant="primary" className="w-full p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Text variant="h3" as={titleAs} className="whitespace-nowrap">
          {PRESENCE_TITLE}{" "}
          {waiting ? (
            <span aria-hidden="true">
              (<Skeleton shape="text" tone="ruby" className="w-[0.8em]" />)
            </span>
          ) : (
            `(${members.length})`
          )}
        </Text>
        <span
          className="flex items-center gap-2 font-sans text-xs text-muted-foreground"
          aria-live="polite"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
          <span className="grid">
            <span className="[grid-area:1/1]">{STATUS_LABELS[status]}</span>
            {CONNECTION_STATUSES.map((key) => (
              <span
                key={key}
                aria-hidden="true"
                data-label={STATUS_LABELS[key]}
                className="invisible [grid-area:1/1] before:content-[attr(data-label)]"
              />
            ))}
          </span>
        </span>
      </div>
      {waiting ? (
        <SkeletonRegion label={PRESENCE_LOADING_LABEL} announce={!nested}>
          <ul className="space-y-2">
            {loadingRows.map((row) => (
              <PresenceMemberSkeleton key={row} />
            ))}
          </ul>
        </SkeletonRegion>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => (
            <PresenceMember key={member.accountId} member={member} />
          ))}
        </ul>
      )}
    </Panel>
  );
}
