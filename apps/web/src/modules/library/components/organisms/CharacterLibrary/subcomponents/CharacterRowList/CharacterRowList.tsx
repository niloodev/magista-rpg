import { CharacterRow } from "@/modules/library/components/molecules";
import { ActionMenu } from "@/shared/components/molecules";

import type { CharacterRowListProps } from "./CharacterRowList.types";

export function CharacterRowList({ label, items, emptyText }: CharacterRowListProps) {
  if (items.length === 0)
    return <p className="py-10 text-center font-sans text-base text-muted-strong">{emptyText}</p>;
  return (
    <ul aria-label={label} className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <CharacterRow
            name={item.name}
            subtitle={item.subtitle}
            href={item.href}
            portraitUrl={item.portraitUrl}
            path={item.path}
            accountLabels={item.accountLabels}
            actions={item.menu && <ActionMenu label={`Ações de ${item.name}`} items={item.menu} />}
          />
        </li>
      ))}
    </ul>
  );
}
