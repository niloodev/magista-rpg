import { ATTRIBUTE_LABELS, SKILLS } from "@magista/shared";

import type { SheetSectionProps } from "@/modules/sheet/sheet.types";
import { Panel, SectionHeader } from "@/shared/components/molecules";

import { SkillRow } from "./subcomponents";

export function SkillsPanel({ sheet, derived, onEdit, onRoll }: SheetSectionProps) {
  return (
    <Panel variant="inner" className="p-5">
      <SectionHeader title="Perícias" icon="search" />
      <p className="mb-2 font-sans text-sm text-muted-strong">
        Marque a proficiência e clique na perícia para rolar.
      </p>
      <ul>
        {SKILLS.map((skill) => (
          <SkillRow
            key={skill.key}
            name={skill.name}
            attribute={ATTRIBUTE_LABELS[skill.attribute].short}
            value={derived.skills[skill.key]}
            proficient={sheet.skills[skill.key].proficient}
            onProficientChange={(proficient) =>
              onEdit((draft) => void (draft.skills[skill.key].proficient = proficient))
            }
            onRoll={() => onRoll({ kind: "skill", key: skill.key })}
          />
        ))}
      </ul>
    </Panel>
  );
}
