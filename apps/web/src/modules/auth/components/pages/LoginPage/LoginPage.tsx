"use client";

import { LoginBackground, LoginPanel } from "@/modules/auth/components/organisms";

import { useLoginPage } from "./LoginPage.hook";

export function LoginPage() {
  useLoginPage();
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-void-900">
      <LoginBackground />
      <div className="relative z-20 mx-4 my-8 flex w-full max-w-[355px] flex-col items-center">
        <LoginPanel />
      </div>
    </main>
  );
}
