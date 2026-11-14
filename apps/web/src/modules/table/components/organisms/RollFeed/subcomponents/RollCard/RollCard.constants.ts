import type { RollResultKind } from "@magista/shared";

import type { IconName } from "@/shared/components/atoms";

export const KIND_ICONS: Record<RollResultKind, IconName> = {
  attribute: "sparkles",
  skill: "search",
  initiative: "zap",
  baseDamage: "flame",
  lifeDie: "heart",
  sanityDie: "droplet",
  block: "shield",
  counterAttack: "sword",
  ability: "sword",
  levelUp: "chevrons-up",
};
