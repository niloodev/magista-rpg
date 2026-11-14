export const PROFICIENT_VALUE = "proficiente";

export const REPEATING_FIELDS = {
  habs: [
    "habname",
    "habmodS",
    "habdado",
    "habdamage",
    "habhitmodS",
    "habbasedamage",
    "habproficiency",
    "habdesc",
  ],
  reino: [
    "reinoname",
    "reinomodS",
    "reinodado",
    "reinodamage",
    "reinohitmodS",
    "reinobasedamage",
    "reinoproficiency",
    "reinodesc",
  ],
  inventory: ["invname", "invquant", "invca", "invpeso", "invdesc"],
  tracos: ["traconame", "tracodesc"],
} as const;

export const LEGACY_ALIGNMENT_ALIASES: Record<string, string> = {
  morte: "anatema",
  vida: "talisma",
};

export const TEXT_LIMITS = {
  short: 200,
  long: 20000,
} as const;
