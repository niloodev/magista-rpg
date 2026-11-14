import { AttributesSkeleton } from "../AttributesSkeleton";
import { CombatSkeleton } from "../CombatSkeleton";
import { SkillsSkeleton } from "../SkillsSkeleton";
import { VitalsSkeleton } from "../VitalsSkeleton";

/**
 * Placeholder of the "Ficha" tab, in the same grid as `SheetPage`.
 */
export function SheetOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6 pt-6">
      <AttributesSkeleton />
      <div className="grid gap-6 2xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <VitalsSkeleton />
          <CombatSkeleton />
        </div>
        <SkillsSkeleton />
      </div>
    </div>
  );
}
