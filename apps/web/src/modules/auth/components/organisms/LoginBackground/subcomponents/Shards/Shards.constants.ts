export const FOCAL_POINT = { x: 50, y: 62 } as const;

export const BG_SHARDS = [
  {
    clip: "polygon(20% 0%, 65% 0%, 50% 62%)",
    bg: "linear-gradient(150deg, rgba(215,26,86,0.32) 0%, rgba(80,8,33,0.50) 100%)",
  },
  {
    clip: "polygon(65% 0%, 85% 0%, 50% 62%)",
    bg: "linear-gradient(180deg, rgba(52,5,22,0.66) 0%, rgba(94,9,39,0.48) 100%)",
  },
  {
    clip: "polygon(85% 0%, 100% 0%, 100% 26%, 50% 62%)",
    bg: "linear-gradient(210deg, rgba(170,18,70,0.28) 0%, rgba(58,5,25,0.54) 100%)",
  },
  {
    clip: "polygon(100% 26%, 100% 78%, 50% 62%)",
    bg: "linear-gradient(260deg, rgba(20,2,10,0.82) 0%, rgba(48,4,21,0.64) 100%)",
  },
  {
    clip: "polygon(100% 78%, 100% 100%, 74% 100%, 50% 62%)",
    bg: "linear-gradient(220deg, rgba(226,35,96,0.24) 0%, rgba(88,8,37,0.44) 100%)",
  },
  {
    clip: "polygon(74% 100%, 44% 100%, 50% 62%)",
    bg: "linear-gradient(320deg, rgba(88,8,35,0.56) 0%, rgba(50,4,21,0.70) 100%)",
  },
  {
    clip: "polygon(44% 100%, 14% 100%, 50% 62%)",
    bg: "linear-gradient(350deg, rgba(40,4,17,0.72) 0%, rgba(72,6,29,0.54) 100%)",
  },
  {
    clip: "polygon(14% 100%, 0% 100%, 0% 74%, 50% 62%)",
    bg: "linear-gradient(10deg, rgba(215,30,88,0.28) 0%, rgba(70,6,29,0.48) 100%)",
  },
  {
    clip: "polygon(0% 74%, 0% 28%, 50% 62%)",
    bg: "linear-gradient(80deg, rgba(14,2,8,0.86) 0%, rgba(44,4,19,0.68) 100%)",
  },
  {
    clip: "polygon(0% 28%, 0% 0%, 20% 0%, 50% 62%)",
    bg: "linear-gradient(110deg, rgba(154,16,64,0.40) 0%, rgba(64,6,27,0.56) 100%)",
  },
];

export const CRACK_ENDS: [number, number][] = [
  [20, 0],
  [65, 0],
  [85, 0],
  [100, 26],
  [100, 78],
  [74, 100],
  [44, 100],
  [14, 100],
  [0, 74],
  [0, 28],
];
