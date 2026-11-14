import { Text } from "@/shared/components/atoms";
import { Panel, SectionHeader } from "@/shared/components/molecules";

import { MARKED_SOUL_RULES } from "./MarkedSoulPanel.constants";

export function MarkedSoulPanel() {
  return (
    <Panel variant="primary" className="relative overflow-hidden p-5">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 right-4 font-serif text-[140px] leading-none text-primary/10 select-none"
      >
        ᛟ
      </span>
      <SectionHeader title="Alma de Marcado" icon="sparkles" />
      <div className="relative grid gap-4 md:grid-cols-2">
        {MARKED_SOUL_RULES.map((rule) => (
          <div key={rule.title}>
            <Text variant="fieldLabel" as="p" className="mb-1">
              {rule.title}
            </Text>
            <Text variant="body">{rule.text}</Text>
          </div>
        ))}
      </div>
    </Panel>
  );
}
