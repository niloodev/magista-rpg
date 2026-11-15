import { SPECIAL_FEATURES } from "@magista/shared";

import { FEATURE_SHEET_SLOTS, FEATURE_TONE_CLASSES } from "@/modules/features/features.constants";
import { splitBadges } from "@/modules/features/features.utils";
import { Icon } from "@/shared/components/atoms";

import { BADGE_BASE, BADGE_SIZES, COMPACT_LABEL, MORE_TONE } from "./FeatureBadges.constants";
import type { FeatureBadgesProps } from "./FeatureBadges.types";

export function FeatureBadges({ features, size = "md", max, compact = false }: FeatureBadgesProps) {
  if (features.length === 0) return null;
  const sizing = BADGE_SIZES[size];
  const { shown, hiddenCount, hiddenLabel } = splitBadges(features, max);
  return (
    <span
      role="list"
      aria-label="Tags especiais"
      className="inline-flex flex-wrap items-center gap-1.5 align-middle"
    >
      {shown.map((key) => {
        const slots = FEATURE_SHEET_SLOTS[key];
        return (
          <span
            key={key}
            role="listitem"
            title={SPECIAL_FEATURES[key].label}
            className={`${BADGE_BASE} ${FEATURE_TONE_CLASSES[slots.badgeTone]} ${sizing.box}`}
          >
            <Icon name={slots.badgeIcon} size={sizing.icon} />
            <span className={compact ? COMPACT_LABEL : undefined}>
              {SPECIAL_FEATURES[key].label}
            </span>
          </span>
        );
      })}
      {hiddenCount > 0 && (
        <span
          role="listitem"
          title={hiddenLabel}
          className={`${BADGE_BASE} ${MORE_TONE} ${sizing.box}`}
        >
          <span aria-hidden="true">+{hiddenCount}</span>
          <span className="sr-only">{hiddenLabel}</span>
        </span>
      )}
    </span>
  );
}
