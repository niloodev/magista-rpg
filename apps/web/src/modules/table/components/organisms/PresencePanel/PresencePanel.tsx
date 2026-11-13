import { Text } from "@/shared/components/atoms";
import { Panel } from "@/shared/components/molecules";

import { STATUS_DOT, STATUS_LABELS } from "./PresencePanel.constants";
import type { PresencePanelProps } from "./PresencePanel.types";
import { PresenceMember } from "./subcomponents";

export function PresencePanel({ status, members }: PresencePanelProps) {
  return (
    <Panel variant="primary" className="w-full p-6">
      <div className="mb-4 flex items-center justify-between">
        <Text variant="h3">Jogadores online ({members.length})</Text>
        <span
          className="flex items-center gap-2 font-sans text-xs text-muted-foreground"
          aria-live="polite"
        >
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
          {STATUS_LABELS[status]}
        </span>
      </div>
      <ul className="space-y-2">
        {members.map((member) => (
          <PresenceMember key={member.accountId} member={member} />
        ))}
      </ul>
    </Panel>
  );
}
