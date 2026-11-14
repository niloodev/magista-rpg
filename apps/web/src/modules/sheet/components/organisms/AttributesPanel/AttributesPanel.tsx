import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from "@magista/shared";

import { AttributeCard } from "@/modules/sheet/components/molecules";
import type { SheetSectionProps } from "@/modules/sheet/sheet.types";
import { Panel, SectionHeader } from "@/shared/components/molecules";

export function AttributesPanel({ sheet, derived, onEdit, onRoll }: SheetSectionProps) {
  return (
    <Panel variant="inner" className="p-5">
      <SectionHeader title="Atributos" icon="sparkles" />
      <p className="mb-4 font-sans text-sm text-muted-strong">
        Clique no modificador para rolar o teste.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
        {ATTRIBUTE_KEYS.map((key) => (
          <AttributeCard
            key={key}
            label={ATTRIBUTE_LABELS[key].short}
            name={ATTRIBUTE_LABELS[key].name}
            value={sheet.attributes[key].value}
            proficient={sheet.attributes[key].proficient}
            derived={derived.attributes[key]}
            onValueChange={(value) => onEdit((draft) => void (draft.attributes[key].value = value))}
            onProficientChange={(proficient) =>
              onEdit((draft) => void (draft.attributes[key].proficient = proficient))
            }
            onRoll={() => onRoll({ kind: "attribute", key })}
          />
        ))}
      </div>
    </Panel>
  );
}
