import { SKELETON_HIDDEN_CONTENT, SKELETON_SHAPES, SKELETON_TONES } from "./Skeleton.constants";
import type { SkeletonProps } from "./Skeleton.types";

/**
 * Placeholder shown while data loads. Pulses only in opacity and is hidden from assistive tech.
 * `text` is a bar sized by the surrounding typography (put it inside the same text classes as the real value);
 * `glyphs` paints invisible sample text, so the placeholder wraps exactly like the real copy;
 * any children are kept for sizing but hidden (`visibility: hidden`), while the bar keeps its background.
 */
export function Skeleton({ shape = "bar", tone = "neutral", className, children }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      data-skeleton=""
      className={`shrink-0 animate-skeleton-pulse ${SKELETON_SHAPES[shape]} ${SKELETON_TONES[tone]} ${className ?? ""}`}
    >
      {children && <span className={SKELETON_HIDDEN_CONTENT}>{children}</span>}
    </span>
  );
}
