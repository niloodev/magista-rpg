import {
  PILLAR_XS,
  RIBS,
  ROSE_CENTER,
  ROSE_SPOKES,
  SIDE_WINDOWS,
  SPIRES,
  TRIFORIUM_XS,
} from "./Cathedral.constants";

export function Cathedral() {
  const { x: cx, y: cy } = ROSE_CENTER;
  return (
    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="magista-rose-light" cx="50%" cy="18%" r="22%">
          <stop offset="0%" stopColor="rgba(234,40,100,0.28)" />
          <stop offset="100%" stopColor="rgba(234,40,100,0)" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx="24" ry="24" fill="url(#magista-rose-light)" />
      {RIBS.map((rib) => (
        <path key={rib.d} d={rib.d} fill="none" stroke={rib.stroke} strokeWidth={rib.width} />
      ))}
      <circle
        cx={cx}
        cy={cy}
        r="11"
        fill="rgba(156,13,61,0.09)"
        stroke="rgba(226,30,92,0.24)"
        strokeWidth="0.28"
      />
      <circle cx={cx} cy={cy} r="7" fill="none" stroke="rgba(212,22,84,0.15)" strokeWidth="0.20" />
      <circle
        cx={cx}
        cy={cy}
        r="3.5"
        fill="none"
        stroke="rgba(226,30,92,0.18)"
        strokeWidth="0.18"
      />
      <circle cx={cx} cy={cy} r="1.2" fill="rgba(234,38,98,0.32)" />
      {ROSE_SPOKES.map((spoke, index) => (
        <line
          key={index}
          x1={cx}
          y1={cy}
          x2={spoke.x2}
          y2={spoke.y2}
          stroke="rgba(218,26,88,0.14)"
          strokeWidth="0.14"
        />
      ))}
      {TRIFORIUM_XS.map((x) => (
        <path
          key={x}
          d={`M ${x - 3} 46 Q ${x} 41 ${x + 3} 46`}
          fill="none"
          stroke="rgba(198,18,76,0.11)"
          strokeWidth="0.18"
        />
      ))}
      {SIDE_WINDOWS.map((window) => (
        <g key={window.outer}>
          <path
            d={window.outer}
            fill="rgba(48,5,19,0.42)"
            stroke="rgba(198,20,76,0.17)"
            strokeWidth="0.20"
          />
          <path d={window.inner} fill="none" stroke="rgba(168,14,66,0.10)" strokeWidth="0.15" />
        </g>
      ))}
      {SPIRES.map((spire) => (
        <polygon key={spire.points} points={spire.points} fill={spire.fill} />
      ))}
      {PILLAR_XS.map((x) => (
        <rect key={x} x={x} y="52" width="3.5" height="48" fill="rgba(38,3,15,0.58)" />
      ))}
      <line x1="-5" y1="99" x2="50" y2="83" stroke="rgba(156,14,61,0.07)" strokeWidth="0.25" />
      <line x1="105" y1="99" x2="50" y2="83" stroke="rgba(156,14,61,0.07)" strokeWidth="0.25" />
    </svg>
  );
}
