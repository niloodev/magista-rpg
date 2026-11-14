import { formatSigned } from "@/modules/sheet/sheet.utils";
import { Checkbox, Icon } from "@/shared/components/atoms";
import { Stepper } from "@/shared/components/molecules";

import type { AttributeCardProps } from "./AttributeCard.types";

export function AttributeCard({
  label,
  name,
  value,
  proficient,
  derived,
  onValueChange,
  onProficientChange,
  onRoll,
}: AttributeCardProps) {
  return (
    <div
      role="group"
      aria-label={name}
      className="group flex flex-col items-center gap-3 border border-primary/30 bg-black/50 p-3 shadow-[var(--magista-glow-card)] transition-all duration-300 hover:border-primary/60 hover:shadow-[var(--magista-glow-card-hover)]"
    >
      <button
        type="button"
        onClick={onRoll}
        className="flex w-full cursor-pointer flex-col items-center gap-1 py-1 transition-transform active:scale-95"
      >
        <span className="flex items-center gap-1.5 font-sans text-sm font-bold tracking-[0.15em] text-accent-text uppercase">
          <Icon
            name="dices"
            size={16}
            className="transition-transform duration-300 group-hover:rotate-12"
          />
          {label}
        </span>
        <span className="font-serif text-5xl leading-none font-light text-foreground group-hover:text-white">
          {formatSigned(derived.modifier)}
        </span>
        <span className="sr-only">Rolar teste de {name}</span>
      </button>
      <Stepper
        value={value}
        onValueChange={onValueChange}
        min={0}
        max={99}
        label={`Valor de ${name}`}
      />
      <div className="flex w-full items-center justify-between gap-2 border-t border-white/10 pt-2">
        <span
          className="font-sans text-sm text-muted-strong"
          title="Classe de Dificuldade do atributo"
        >
          CD <span className="font-serif text-lg text-foreground">{derived.dc}</span>
        </span>
        <Checkbox
          checked={proficient}
          onCheckedChange={onProficientChange}
          label="Prof."
          aria-label={`Proficiente em ${name}`}
        />
      </div>
    </div>
  );
}
