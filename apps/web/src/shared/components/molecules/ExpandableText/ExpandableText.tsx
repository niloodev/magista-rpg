"use client";

import { Icon, RichText } from "@/shared/components/atoms";

import { CLAMPED_FADE, DEFAULT_COLLAPSED_HEIGHT } from "./ExpandableText.constants";
import { useExpandableText } from "./ExpandableText.hook";
import type { ExpandableTextProps } from "./ExpandableText.types";

export function ExpandableText({
  text,
  collapsedHeight = DEFAULT_COLLAPSED_HEIGHT,
  className,
}: ExpandableTextProps) {
  const { contentRef, contentId, overflowing, expanded, toggle } =
    useExpandableText(collapsedHeight);
  const clamped = overflowing && !expanded;
  return (
    <div className={className}>
      <div
        id={contentId}
        className={`relative overflow-hidden ${clamped ? CLAMPED_FADE : ""}`}
        style={{ maxHeight: clamped ? collapsedHeight : undefined }}
      >
        <div ref={contentRef}>
          <RichText text={text} />
        </div>
      </div>
      {overflowing && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-controls={contentId}
          className="mt-2 inline-flex min-h-8 cursor-pointer items-center gap-1 font-sans text-sm font-semibold text-accent-text hover:underline"
        >
          {expanded ? "Mostrar menos" : "Mostrar mais"}
          <Icon
            name="chevron-down"
            size={16}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
