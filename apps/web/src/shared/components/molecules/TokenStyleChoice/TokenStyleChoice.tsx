import Image from "next/image";

import { Icon } from "@/shared/components/atoms";

import { TOKEN_STYLE_OPTIONS } from "./TokenStyleChoice.constants";
import type { TokenStyleChoiceProps } from "./TokenStyleChoice.types";

/**
 * Two option cards (native radios) to draw a token as a round avatar or as an isometric figure.
 */
export function TokenStyleChoice({
  id,
  legend,
  value,
  onChange,
  portraitUrl,
  figureUrl,
  figureDisabledReason,
}: TokenStyleChoiceProps) {
  const hintId = `${id}-hint`;
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 font-sans text-xs font-semibold tracking-wider text-muted-strong uppercase">
        {legend}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {TOKEN_STYLE_OPTIONS.map((option) => {
          const disabled = option.style === "figure" && Boolean(figureDisabledReason);
          const imageUrl = option.style === "figure" ? figureUrl : portraitUrl;
          return (
            <label
              key={option.style}
              className="group/style relative flex min-h-11 cursor-pointer items-center gap-3 border border-white/10 bg-black/40 p-2.5 transition-colors duration-300 has-checked:border-gold-400/70 has-checked:bg-gold-400/5 has-disabled:cursor-default has-disabled:opacity-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ruby-400 not-has-disabled:hover:border-primary/40"
            >
              <input
                type="radio"
                name={id}
                value={option.style}
                checked={value === option.style}
                disabled={disabled}
                aria-describedby={disabled ? hintId : undefined}
                onChange={() => onChange(option.style)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden ${
                  option.style === "portrait"
                    ? "rounded-full bg-void-700 ring-2 ring-primary/50"
                    : "magista-checker border border-white/10"
                }`}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="48px"
                    className={option.style === "portrait" ? "object-cover" : "object-contain"}
                  />
                ) : (
                  <Icon
                    name={option.style === "portrait" ? "user" : "skull"}
                    size={20}
                    className="text-muted-strong"
                  />
                )}
              </span>
              <span className="grid min-w-0 gap-0.5">
                <span className="font-serif text-[13px] font-semibold tracking-wide text-foreground group-has-checked/style:text-gold-300">
                  {option.label}
                </span>
                <span className="font-sans text-xs text-muted-strong">{option.description}</span>
              </span>
            </label>
          );
        })}
      </div>
      {figureDisabledReason && (
        <p id={hintId} className="font-sans text-xs text-muted-strong">
          {figureDisabledReason}
        </p>
      )}
    </fieldset>
  );
}
