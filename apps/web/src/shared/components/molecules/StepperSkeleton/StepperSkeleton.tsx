import { Skeleton } from "@/shared/components/atoms";
import { STEPPER_SIZES } from "@/shared/components/molecules/Stepper";

import type { StepperSkeletonProps } from "./StepperSkeleton.types";

/**
 * Placeholder of a `Stepper`: the two buttons in their real size and border, and a bar where the value goes.
 */
export function StepperSkeleton({ size = "sm", tone = "ruby" }: StepperSkeletonProps) {
  const sizes = STEPPER_SIZES[size];
  const border = tone === "teal" ? "border-teal-700/50" : "border-primary/30";
  const button = `shrink-0 border bg-black/40 ${sizes.button} ${border}`;
  return (
    <div aria-hidden="true" className="flex items-center justify-center gap-1.5">
      <span className={button} />
      <span className={`flex items-center justify-center ${sizes.field}`}>
        <Skeleton shape="text" tone={tone} className="w-[1.2em]" />
      </span>
      <span className={button} />
    </div>
  );
}
