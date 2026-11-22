import {
  LOADING_BREATHE_CLASS,
  LOADING_OTHALA,
  LOADING_RING_LENGTH,
  LOADING_RUNE_RADIUS,
  LOADING_RUNES,
  LOADING_SPIN_CLASS,
} from "./AssetLoadingScreen.constants";
import type { AssetLoadingScreenProps } from "./AssetLoadingScreen.types";

/**
 * The screen shown while the static assets of a screen load (the world map, and the next ones): a seal of the
 * Marca with a ring of runes turning around the Othala, a gold ring that fills with the progress, the title and
 * what is loading. Only for files of the app; data from the API keeps its skeletons. It is there from the first
 * frame (no fade in, so the route skeleton can hand it over to the page without a blink) and fades out; with
 * reduced motion or the performance mode the seal stands still.
 */
export function AssetLoadingScreen({
  progress,
  title,
  detail,
  label,
  closing,
  version,
  className,
}: AssetLoadingScreenProps) {
  const percent = Math.round(progress * 100);
  return (
    <div
      data-state={closing ? "closing" : "open"}
      aria-busy={!closing}
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-void-900 data-[state=closing]:animate-overlay-out ${className ?? ""}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(196,22,82,0.22),transparent_55%),radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.06),transparent_70%)]"
      />
      <div className="relative flex flex-col items-center gap-7 px-4 text-center">
        <svg viewBox="-100 -100 200 200" className="h-44 w-44" aria-hidden="true">
          <circle r="96" fill="none" stroke="rgba(231,199,122,0.18)" strokeWidth="1.5" />
          <circle r="90" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            r="90"
            fill="none"
            stroke="var(--magista-gold-300)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={LOADING_RING_LENGTH}
            strokeDashoffset={LOADING_RING_LENGTH * (1 - progress)}
            transform="rotate(-90)"
            className="transition-[stroke-dashoffset] duration-300 ease-out"
          />
          <g className={LOADING_SPIN_CLASS}>
            {LOADING_RUNES.map((path, index) => {
              const angle = (index / LOADING_RUNES.length) * 360;
              return (
                <path
                  key={path}
                  d={path}
                  transform={`rotate(${angle}) translate(0 ${-LOADING_RUNE_RADIUS})`}
                  fill="none"
                  stroke="var(--magista-gold-300)"
                  strokeOpacity="0.75"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
          </g>
          <circle
            r="56"
            fill="rgba(6,2,3,0.85)"
            stroke="var(--magista-ruby-600)"
            strokeWidth="1.5"
          />
          <g className={LOADING_BREATHE_CLASS}>
            <path
              d={LOADING_OTHALA}
              fill="none"
              stroke="var(--magista-ruby-600)"
              strokeOpacity="0.6"
              strokeWidth="13"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={LOADING_OTHALA}
              fill="none"
              stroke="var(--magista-gold-300)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
        <p className="font-serif text-sm tracking-[0.35em] text-gold-300 uppercase">{title}</p>
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-[3px] w-72 max-w-full overflow-hidden bg-white/10"
        >
          <div
            className="h-full bg-gradient-to-r from-ruby-600 to-gold-300 transition-[width] duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="font-sans text-xs text-muted-strong tabular-nums">{detail}</p>
        {version && (
          <p className="font-sans text-xs tracking-[0.2em] text-muted-strong/70">{version}</p>
        )}
      </div>
    </div>
  );
}
