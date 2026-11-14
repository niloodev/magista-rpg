"use client";

import { HEXAGON } from "@/modules/table/table.constants";
import { Icon } from "@/shared/components/atoms";

import { FUMBLE_LABEL, HEX_THEMES } from "./DiceRollOverlay.constants";
import { useDiceRollOverlay } from "./DiceRollOverlay.hook";
import type { DiceRollOverlayProps } from "./DiceRollOverlay.types";

export function DiceRollOverlay(props: DiceRollOverlayProps) {
  const { roll } = props;
  const { phase, leaving, spinValue, primary, secondary, dice, modifier, natural, close } =
    useDiceRollOverlay(props);
  const total = primary?.outcome.total ?? 0;
  const rolling = phase === "rolling";
  const revealed = phase === "result";
  const critical = revealed && natural === "critical";
  const theme = HEX_THEMES[critical ? "gold" : "ruby"];
  return (
    <div
      className={`animate-overlay-in fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}
    >
      <button
        type="button"
        aria-label="Fechar rolagem"
        onClick={close}
        className="absolute inset-0 cursor-default bg-black/85 backdrop-blur-md"
      />
      <div className="pointer-events-none relative flex flex-col items-center">
        <p
          className={`mb-6 text-center font-serif text-2xl tracking-[0.12em] uppercase transition-colors duration-500 ${critical ? "text-gold-300" : "text-accent-text drop-shadow-[0_0_12px_rgba(228,42,99,0.6)]"}`}
        >
          {roll.title}
          <span className="mt-1 block font-sans text-sm tracking-wider text-muted-strong normal-case">
            {roll.characterName} · {primary?.label} ({primary?.outcome.expression})
          </span>
        </p>
        <div className="relative flex h-48 w-48 items-center justify-center">
          <div
            className="relative flex h-48 w-48 items-center justify-center transition-transform duration-500"
            style={{
              clipPath: HEXAGON,
              background: rolling ? "rgba(15,2,6,0.92)" : "rgba(20,2,8,0.96)",
              transform: rolling ? "scale(1.02)" : "scale(1)",
            }}
          >
            <div
              className={`absolute inset-0 ${rolling ? "animate-pulse" : ""}`}
              style={{ clipPath: HEXAGON, background: theme.ring }}
            />
            <div className="absolute inset-[3px] bg-void-900" style={{ clipPath: HEXAGON }} />
            <div
              className="absolute inset-0"
              style={{
                background: rolling
                  ? "radial-gradient(circle at center, rgba(228,42,99,0.22) 0%, transparent 70%)"
                  : critical
                    ? "rgba(120,72,6,0.18)"
                    : "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(228,42,99,0.14))",
              }}
            />
            {rolling && (
              <div className="animate-pulse-breath absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-primary/30 blur-xl" />
              </div>
            )}
            {revealed && !critical && (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`h-24 w-24 animate-pulse rounded-full blur-2xl ${HEX_THEMES.ruby.glow}`}
                  />
                </div>
                <div
                  className={`animate-flash-out absolute inset-0 z-10 ${HEX_THEMES.ruby.flash}`}
                />
              </>
            )}
            <div className="relative z-20 flex flex-col items-center font-serif">
              {rolling && (
                <div className="animate-float-rune flex flex-col items-center">
                  <span className="mb-2 text-[2.75rem] leading-none text-accent-text/80 blur-[0.4px]">
                    {spinValue}
                  </span>
                  <span className="relative flex h-8 w-8 items-center justify-center">
                    <span className="absolute h-6 w-6 rotate-45 border border-primary/60 bg-primary/20 shadow-[0_0_10px_rgba(228,42,99,0.5)]" />
                    <span className="absolute h-3 w-3 rotate-45 bg-primary/70 shadow-[0_0_10px_rgba(228,42,99,0.9)]" />
                  </span>
                </div>
              )}
              {phase === "adding" && (
                <span className="animate-pop-in text-[4rem] leading-none text-white/85">
                  {dice}
                </span>
              )}
              {revealed && (
                <span
                  className={`text-[4.5rem] leading-none ${critical ? "animate-crit-slam" : "animate-pop-in"} ${theme.total}`}
                >
                  {total}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex min-h-20 flex-col items-center gap-3">
          {phase === "adding" && (
            <p className="animate-slide-down-in flex items-center gap-3 font-serif">
              <span className="text-2xl text-white/70">{dice}</span>
              <span className="text-xl text-accent-text">{modifier < 0 ? "-" : "+"}</span>
              <span className="text-3xl font-bold text-white">{Math.abs(modifier)}</span>
            </p>
          )}
          {critical && (
            <p className="animate-crit-slam flex flex-col items-center">
              <span
                data-testid="critical-label"
                className="font-serif text-4xl font-bold tracking-[0.2em] text-gold-300 uppercase"
              >
                Crítico!
              </span>
              <span className="mt-1 flex items-center gap-2 font-sans text-sm font-bold tracking-[0.25em] text-gold-300 uppercase">
                <Icon name="crown" size={16} /> 20 natural
              </span>
            </p>
          )}
          {revealed && !critical && (
            <p className="animate-pop-in font-serif text-sm tracking-[0.25em] text-accent-text uppercase">
              Rolagem final
            </p>
          )}
          {revealed && natural === "fumble" && (
            <p className="animate-pop-in font-sans text-base font-bold tracking-wider text-accent-text uppercase">
              {FUMBLE_LABEL}
            </p>
          )}
          {revealed && secondary.length > 0 && (
            <div className="animate-slide-down-in flex flex-wrap justify-center gap-3">
              {secondary.map((row) => (
                <div
                  key={row.label}
                  className="border border-teal-500/50 bg-black/70 px-4 py-2 text-center"
                >
                  <p className="font-sans text-sm text-teal-200">
                    {row.label} ({row.outcome.expression})
                  </p>
                  <p className="font-serif text-3xl text-white">{row.outcome.total}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={close}
        className="absolute top-4 right-4 flex h-11 items-center gap-2 border border-white/15 bg-black/60 px-4 font-sans text-sm text-muted-strong hover:text-foreground"
      >
        <Icon name="x" size={16} /> Fechar (Esc)
      </button>
      <p className="sr-only" aria-live="assertive">
        {revealed
          ? `${critical ? "Crítico! 20 natural. " : ""}${roll.title}: ${roll.rows.map((row) => `${row.label} ${row.outcome.total}`).join(", ")}`
          : ""}
      </p>
    </div>
  );
}
