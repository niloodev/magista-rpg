export const BLOCK_KEYS = ["firme", "desviante", "agressivo"] as const;

export const BLOCKS = {
  firme: { name: "Bloqueio Firme", attribute: "con", extremeAt: 20, summary: "Reduz o dano" },
  desviante: {
    name: "Bloqueio Desviante",
    attribute: "des",
    extremeAt: 17,
    summary: "Esquiva do ataque",
  },
  agressivo: {
    name: "Bloqueio Agressivo",
    attribute: "con",
    extremeAt: 17,
    summary: "Anula o dano, com risco",
  },
} as const;

export const COUNTER_ATTACK_FUMBLE_BELOW = 5;

export const ROLL_PHASES_MS = {
  rolling: 1800,
  adding: 1200,
  result: 2600,
} as const;

export const ROLL_REVEAL_DELAY_MS = ROLL_PHASES_MS.rolling + ROLL_PHASES_MS.adding;

export const OPENING_COSTS = {
  attackBonus: 1,
  ignoreArmor: 1,
  counterAttack: 1,
  advanced: 4,
} as const;

export const OPENING_ACTIONS = [
  {
    key: "attackBonus",
    name: "+1 no ataque",
    effect: "Soma +1 no dado de ataque.",
    cost: OPENING_COSTS.attackBonus,
    rolls: false,
  },
  {
    key: "ignoreArmor",
    name: "Ignorar CA",
    effect: "O ataque ignora a CA do inimigo.",
    cost: OPENING_COSTS.ignoreArmor,
    rolls: false,
  },
  {
    key: "counterAttack",
    name: "Contra-ataque",
    effect: `Rola FOR. Dado natural abaixo de ${COUNTER_ATTACK_FUMBLE_BELOW} perde todas as Aberturas.`,
    cost: OPENING_COSTS.counterAttack,
    rolls: true,
  },
  {
    key: "advanced",
    name: "Gasto avançado",
    effect: "Dano dobrado e ignora a CA neste turno.",
    cost: OPENING_COSTS.advanced,
    rolls: false,
  },
] as const;
