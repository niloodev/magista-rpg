import type { Metadata } from "next";
import { Cinzel, Raleway } from "next/font/google";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import "@/core/assets/global.css";
import { GlobalProviders } from "@/core/providers";
import { PERF_COOKIE } from "@/core/services/performance";
import { parsePerfMode } from "@/shared/hooks";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cinzel",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-raleway",
});

export const metadata: Metadata = {
  title: "Magista",
  description: "Fichas, chat e rolagens da mesa Magista.",
  icons: { icon: "/logo.webp" },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const perfMode = parsePerfMode((await cookies()).get(PERF_COOKIE)?.value);
  return (
    <html
      lang="pt-BR"
      className={`${cinzel.variable} ${raleway.variable}`}
      data-perf={perfMode ?? undefined}
    >
      <body>
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
