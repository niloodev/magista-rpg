export const ROSE_CENTER = { x: 50, y: 18 } as const;

export const ROSE_SPOKES = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2;
  return {
    x2: Number((ROSE_CENTER.x + Math.cos(angle) * 10.5).toFixed(3)),
    y2: Number((ROSE_CENTER.y + Math.sin(angle) * 10.5).toFixed(3)),
  };
});

export const TRIFORIUM_XS = [15, 22, 29, 36, 64, 71, 78, 85];

export const RIBS = [
  { d: "M -6 106 Q 18 50 50 4", stroke: "rgba(208,24,84,0.16)", width: 0.28 },
  { d: "M 106 106 Q 82 50 50 4", stroke: "rgba(208,24,84,0.16)", width: 0.28 },
  { d: "M -6 80 Q 28 42 50 10", stroke: "rgba(190,20,76,0.11)", width: 0.22 },
  { d: "M 106 80 Q 72 42 50 10", stroke: "rgba(190,20,76,0.11)", width: 0.22 },
  { d: "M 17 106 Q 36 52 50 8", stroke: "rgba(170,17,68,0.09)", width: 0.18 },
  { d: "M 83 106 Q 64 52 50 8", stroke: "rgba(170,17,68,0.09)", width: 0.18 },
  { d: "M 4 106 Q 30 56 50 13", stroke: "rgba(156,14,61,0.07)", width: 0.15 },
  { d: "M 96 106 Q 70 56 50 13", stroke: "rgba(156,14,61,0.07)", width: 0.15 },
  { d: "M -5 43 Q 25 39 50 43 Q 75 47 105 43", stroke: "rgba(182,18,73,0.08)", width: 0.18 },
];

export const SIDE_WINDOWS = [
  {
    outer: "M 6 100 L 6 52 Q 6 36 18 36 Q 30 36 30 52 L 30 100",
    inner: "M 9 100 L 9 55 Q 9 42 18 42 Q 27 42 27 55 L 27 100",
  },
  {
    outer: "M 70 100 L 70 52 Q 70 36 82 36 Q 94 36 94 52 L 94 100",
    inner: "M 73 100 L 73 55 Q 73 42 82 42 Q 91 42 91 55 L 91 100",
  },
];

export const SPIRES = [
  { points: "13,100 23,100 18,1", fill: "rgba(42,4,17,0.46)" },
  { points: "77,100 87,100 82,1", fill: "rgba(42,4,17,0.46)" },
  { points: "4,100 9,100 6.5,30", fill: "rgba(32,3,13,0.34)" },
  { points: "91,100 96,100 93.5,30", fill: "rgba(32,3,13,0.34)" },
];

export const PILLAR_XS = [5.5, 91];
