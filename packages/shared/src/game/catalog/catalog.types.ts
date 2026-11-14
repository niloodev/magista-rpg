import type { ALIGNMENT_KEYS, ATTRIBUTE_KEYS, CLASS_KEYS, SKILL_KEYS } from "./catalog.constants";

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

export type SkillKey = (typeof SKILL_KEYS)[number];

export type ClassKey = (typeof CLASS_KEYS)[number];

export type AlignmentKey = (typeof ALIGNMENT_KEYS)[number];
