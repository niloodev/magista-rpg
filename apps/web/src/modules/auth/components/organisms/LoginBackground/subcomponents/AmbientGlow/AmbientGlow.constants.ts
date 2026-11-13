import type { CSSProperties } from "react";

export const AMBIENT_BLOBS: CSSProperties[] = [
  {
    width: "70vw",
    height: "70vh",
    top: "10%",
    left: "15%",
    background: "radial-gradient(ellipse, rgba(182,18,74,0.18) 0%, transparent 65%)",
    filter: "blur(60px)",
    animation: "sf0 14s ease-in-out infinite",
  },
  {
    width: "50vw",
    height: "50vh",
    top: "40%",
    left: "30%",
    background: "radial-gradient(ellipse, rgba(108,10,46,0.14) 0%, transparent 65%)",
    filter: "blur(80px)",
    animation: "sf3 18s ease-in-out infinite 3s",
  },
  {
    width: "35vw",
    height: "40vh",
    top: "5%",
    left: "55%",
    background: "radial-gradient(ellipse, rgba(222,26,90,0.10) 0%, transparent 60%)",
    filter: "blur(50px)",
    animation: "sf1 11s ease-in-out infinite 1s",
  },
];
