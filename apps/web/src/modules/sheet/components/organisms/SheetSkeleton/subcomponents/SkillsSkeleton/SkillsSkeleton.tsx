import { ATTRIBUTE_LABELS, SKILLS } from "@magista/shared";

import { Icon, Skeleton } from "@/shared/components/atoms";
import { Panel, SectionHeader } from "@/shared/components/molecules";

import { CheckboxSkeleton } from "../CheckboxSkeleton";

/**
 * Placeholder of `SkillsPanel`: the 21 real skill names with the value as a bar.
 */
export function SkillsSkeleton() {
  return (
    <Panel variant="inner" className="p-5">
      <SectionHeader title="Perícias" icon="search" as="p" />
      <p className="mb-2 font-sans text-sm text-muted-strong">
        Marque a proficiência e clique na perícia para rolar.
      </p>
      <ul>
        {SKILLS.map((skill) => (
          <li
            key={skill.key}
            className="flex items-center gap-3 border-b border-white/5 last:border-b-0"
          >
            <CheckboxSkeleton className="pl-1" />
            <span className="flex min-h-11 flex-1 items-center gap-3 px-2">
              <span className="font-sans text-[15px] text-foreground/85">{skill.name}</span>
              <span className="font-sans text-xs font-semibold tracking-wider text-muted-strong uppercase">
                {ATTRIBUTE_LABELS[skill.attribute].short}
              </span>
              <span className="ml-auto min-w-10 text-right font-serif text-xl">
                <Skeleton shape="text" className="w-[1.3em]" />
              </span>
              <Icon name="dices" size={18} className="text-accent-text/70" />
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
