import { BG_SHARDS, CRACK_ENDS, FOCAL_POINT } from "./Shards.constants";

export function Shards() {
  return (
    <>
      {BG_SHARDS.map((shard) => (
        <div
          key={shard.clip}
          className="absolute inset-[50px]"
          style={{ clipPath: shard.clip, background: shard.bg }}
        />
      ))}
      <svg
        className="absolute inset-[50px] h-[calc(100%-100px)] w-[calc(100%-100px)]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="magista-crack-glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.26" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="magista-focal-glow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {CRACK_ENDS.map(([x2, y2]) => (
          <line
            key={`${x2}-${y2}`}
            className="animate-crack-fade"
            x1={FOCAL_POINT.x}
            y1={FOCAL_POINT.y}
            x2={x2}
            y2={y2}
            stroke="rgba(238,46,104,0.60)"
            strokeWidth="0.09"
            filter="url(#magista-crack-glow)"
          />
        ))}
        <circle
          cx={FOCAL_POINT.x}
          cy={FOCAL_POINT.y}
          r="0.7"
          fill="rgba(240,52,108,0.82)"
          filter="url(#magista-focal-glow)"
        />
      </svg>
    </>
  );
}
