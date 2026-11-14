import { Button, Icon } from "@/shared/components/atoms";

import type { OpeningActionProps } from "./OpeningAction.types";

export function OpeningAction({
  name,
  effect,
  cost,
  rolls,
  available,
  onSpend,
}: OpeningActionProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-white/5 py-3 last:border-b-0">
      <span
        aria-label={`Custa ${cost} ${cost === 1 ? "Abertura" : "Aberturas"}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center border border-teal-500/50 bg-teal-900/30 font-serif text-lg text-teal-200"
      >
        {cost}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-sans text-[15px] font-semibold text-foreground">{name}</p>
        <p className="font-sans text-[13px] leading-snug text-muted-strong">{effect}</p>
      </div>
      <Button
        variant="mystic"
        size="sm"
        disabled={!available}
        onClick={onSpend}
        icon={<Icon name={rolls ? "dices" : "zap"} size={14} />}
        aria-label={`${rolls ? "Gastar e rolar" : "Gastar"}: ${name}`}
        title={
          available ? undefined : `Precisa de ${cost} ${cost === 1 ? "Abertura" : "Aberturas"}`
        }
      >
        {rolls ? "Gastar e rolar" : "Gastar"}
      </Button>
    </li>
  );
}
