import { Icon, Text } from "@/shared/components/atoms";
import { Panel } from "@/shared/components/molecules";

import type { ArenaNoticeProps } from "./ArenaNotice.types";

/**
 * Centered message over the empty board (no live scene, load failure, WebGL missing).
 */
export function ArenaNotice({ icon, title, body, action, className }: ArenaNoticeProps) {
  return (
    <div className={`flex items-center justify-center px-4 ${className ?? ""}`}>
      <Panel
        variant="glass"
        brackets
        className="flex w-full max-w-md flex-col items-center gap-3 px-6 py-8 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 text-accent-text">
          <Icon name={icon} size={24} aria-hidden="true" />
        </span>
        <Text variant="h2">{title}</Text>
        <Text variant="body">{body}</Text>
        {action}
      </Panel>
    </div>
  );
}
