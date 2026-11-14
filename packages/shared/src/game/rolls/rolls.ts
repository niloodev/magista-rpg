import type { ICharacterSheet } from "../../schemas/character/character.types";
import { ATTRIBUTE_LABELS, SKILLS } from "../catalog/catalog.constants";
import { D20 } from "../rules/rules.constants";
import { deriveSheet } from "../rules/rules";
import { joinExpression } from "../rules/rules.utils";
import { LEVEL_MAX } from "../catalog/catalog.constants";
import { BLOCKS, COUNTER_ATTACK_FUMBLE_BELOW } from "./rolls.constants";
import type { BlockKey, IRollKind, IRollSpec } from "./rolls.types";

/**
 * Possible outcomes of a block for this sheet (reductions use the raw CON value, like the Roll20 sheet).
 */
export function blockOutcomes(key: BlockKey, sheet: ICharacterSheet): string[] {
  const extremeAt = BLOCKS[key].extremeAt;
  if (key === "firme") {
    const con = sheet.attributes.con.value ?? 10;
    const level = sheet.identity.level;
    return [
      `Sucesso: reduz o dano em ${Math.floor((level + con) / 2)}`,
      `Sucesso extremo (${extremeAt}+): reduz o dano em ${con + level}`,
      "Falha: sofre o dano normal",
    ];
  }
  if (key === "desviante") {
    return [
      "Sucesso: desvia totalmente (0 de dano)",
      `Sucesso extremo (${extremeAt}+): desvia e ganha 1 Abertura`,
      "Falha: sofre o dano normal, desvantagem em DES e ataques contra você têm vantagem no próximo turno",
    ];
  }
  return [
    "Sucesso: anula todo o dano",
    `Sucesso extremo (${extremeAt}+): anula e ganha 2 Aberturas`,
    "Falha: sofre 150% do dano e desvantagem em TODOS os dados no próximo turno",
  ];
}

/**
 * Builds what to roll for a sheet action, mirroring the Roll20 roll buttons. Returns null when the target does not exist.
 */
export function buildRollSpec(sheet: ICharacterSheet, roll: IRollKind): IRollSpec | null {
  const derived = deriveSheet(sheet);
  switch (roll.kind) {
    case "attribute": {
      const label = ATTRIBUTE_LABELS[roll.key];
      return {
        title: `Teste de ${label.name}`,
        subtitle: label.short,
        rows: [
          {
            label: "Rolagem",
            expression: joinExpression([D20, derived.attributes[roll.key].modifier]),
          },
        ],
        notes: [`CD ${derived.attributes[roll.key].dc}`],
      };
    }
    case "skill": {
      const skill = SKILLS.find((entry) => entry.key === roll.key);
      if (!skill) return null;
      return {
        title: `Teste de ${skill.name}`,
        subtitle: ATTRIBUTE_LABELS[skill.attribute].short,
        rows: [{ label: "Rolagem", expression: joinExpression([D20, derived.skills[roll.key]]) }],
        notes: [],
      };
    }
    case "initiative":
      return {
        title: "Iniciativa",
        subtitle: "DES",
        rows: [{ label: "Iniciativa", expression: derived.initiative }],
        notes: [],
      };
    case "baseDamage":
      return {
        title: "Dano Base",
        subtitle: `Nível ${sheet.identity.level}`,
        rows: [{ label: "Dano", expression: derived.baseDamage }],
        notes: [],
      };
    case "lifeDie":
      return {
        title: "Dado de Vida",
        subtitle: "CON",
        rows: [{ label: "Vida", expression: derived.lifeDie }],
        notes: [],
      };
    case "sanityDie":
      return {
        title: "Dado de Sanidade",
        subtitle: "SAB",
        rows: [{ label: "Sanidade", expression: derived.sanityDie }],
        notes: [],
      };
    case "block": {
      const block = BLOCKS[roll.key];
      return {
        title: block.name,
        subtitle: ATTRIBUTE_LABELS[block.attribute].short,
        rows: [
          {
            label: "Rolagem",
            expression: joinExpression([D20, derived.attributes[block.attribute].modifier]),
          },
        ],
        notes: blockOutcomes(roll.key, sheet),
      };
    }
    case "counterAttack":
      return {
        title: "Contra-ataque",
        subtitle: "Gasta 1 Abertura",
        rows: [
          { label: "Teste", expression: joinExpression([D20, derived.attributes.for.modifier]) },
        ],
        notes: [
          `Falha crítica (dado natural abaixo de ${COUNTER_ATTACK_FUMBLE_BELOW}): perde TODAS as Aberturas`,
        ],
      };
    case "ability": {
      const ability = sheet[roll.list].find((entry) => entry.id === roll.id);
      const expressions = derived[roll.list][roll.id];
      if (!ability || !expressions) return null;
      return {
        title: ability.name || "Sem nome",
        subtitle: roll.list === "abilities" ? "Habilidade" : "Reino Interior",
        rows: [
          { label: "Ataque", expression: expressions.attack },
          { label: "Dano", expression: expressions.damage },
        ],
        notes: ability.description ? [ability.description] : [],
      };
    }
  }
}

/**
 * Level up roll: Dado de Vida (already includes the CON modifier) and Dado de Sanidade (includes SAB) are added to the maximums.
 * Returns null at the maximum level.
 */
export function buildLevelUpSpec(sheet: ICharacterSheet): IRollSpec | null {
  const { level } = sheet.identity;
  if (level >= LEVEL_MAX) return null;
  const derived = deriveSheet(sheet);
  return {
    title: "Subida de nível",
    subtitle: `Nível ${level} → ${level + 1}`,
    rows: [
      { label: "Vida máxima", expression: derived.lifeDie },
      { label: "Sanidade máxima", expression: derived.sanityDie },
    ],
    notes: [],
  };
}

/**
 * Applies a level up to a sheet: next level and maximums raised by the rolled amounts (current values too when asked).
 */
export function applyLevelUp(
  sheet: ICharacterSheet,
  gains: { health: number; sanity: number },
  addToCurrent: boolean,
): ICharacterSheet {
  const next = structuredClone(sheet);
  next.identity.level = Math.min(LEVEL_MAX, sheet.identity.level + 1);
  const raise = (resource: ICharacterSheet["resources"]["health"], gain: number) => ({
    max: (resource.max ?? 0) + gain,
    current: addToCurrent ? (resource.current ?? 0) + gain : resource.current,
  });
  next.resources.health = raise(sheet.resources.health, gains.health);
  next.resources.sanity = raise(sheet.resources.sanity, gains.sanity);
  return next;
}
